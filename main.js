// Licensed under the Apache License. See footer for details.
var urllib = require('url');

var port = (process.env.VCAP_APP_PORT || 8192);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var url = JSON.parse(process.env.VCAP_APPLICATION || '{"uris":["' + 'https://' + host + ':' + port + '"]}').uris[0] 

function serviceStartsWith(str) {
  var service = {};
  var services = JSON.parse(process.env.VCAP_SERVICES || '{}');
  if (services != undefined) {
    var arr = []; 
    for (attr in services) { services[attr].forEach(function(s) { arr.push(s) }) };
    arr = arr.filter(function(el){return el.name.substring(0, str.length) === str});
    if (arr.length > 0) {service = arr[0].credentials;}
  }      
  return service;
}

var SSO_SERVICE = serviceStartsWith('SSO');
var SSO_AUTHORIZATION_URL = (SSO_SERVICE.authorize_url || 'https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/authorize');
var SSO_TOKEN_URL = (SSO_SERVICE.token_url || 'https://idaas.ng.bluemix.net/sps/oauth20sp/oauth20/token');
var SSO_PROFILE_URL = (SSO_SERVICE.profile_resource || 'https://idaas.ng.bluemix.net/idaas/resources/profile.jsp')
var SSO_CLIENT_ID = process.env.SSO_CLIENT_ID;
var SSO_CLIENT_SECRET = process.env.SSO_CLIENT_SECRET;

var CLOUDANT_SERVICE = serviceStartsWith('Cloudant');
var CLOUDANT_URL = ( CLOUDANT_SERVICE.url ) ;
var CLOUDANT_DATABASE = (CLOUDANT_SERVICE.database || urllib.parse(CLOUDANT_URL).pathname.substring(1));
if (!CLOUDANT_SERVICE.database) CLOUDANT_URL = CLOUDANT_URL.substring(0, CLOUDANT_URL.length - CLOUDANT_DATABASE.length - 1);
var CLOUDANT_USERNAME = ( CLOUDANT_SERVICE.username );
var CLOUDANT_PASSWORD = ( CLOUDANT_SERVICE.password );

var express = require('express');
var passport = require('passport');
var app = express();
app.use(express.static(__dirname + '/static'));
app.use(express.bodyParser());
var sessionStore  = new express.session.MemoryStore;
app.use(express.cookieParser());
app.use(express.session({ secret: "somesecretmagicword", store: sessionStore}));
app.use(passport.initialize());
app.use(passport.session());
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

passport.use('ibmid', new OAuth2Strategy({
    authorizationURL: SSO_AUTHORIZATION_URL,
    tokenURL: SSO_TOKEN_URL,
    profileURL: SSO_PROFILE_URL,
    clientID: SSO_CLIENT_ID,
    clientSecret: SSO_CLIENT_SECRET,
    passReqToCallback: true,
    callbackURL: 'https://' + url + '/auth/ibmid/callback'
  }, function(req, accessToken, refreshToken, profile, done) {
  req.session.ibmid = {};
  req.session.ibmid.accessToken = accessToken;
  req.session.ibmid.refreshToken = refreshToken;
  req.session.ibmid.profile = profile;
  process.nextTick(function () {
      return done(null, profile);
    });
  }
));

app.get('/auth/ibmid', passport.authenticate('ibmid', { state: 'SOME STATE', scope: ['profile']}), function(req, res) {
});

app.get('/auth/ibmid/callback', passport.authenticate('ibmid', {
   successRedirect: '/',
   failureRedirect: '/auth/ibmid',
   scope: ['profile']
}));        

function hasRole(role) {
  if (role == 'admin') {
    return function(req, res, next) {
      if (req.session.ibmid == undefined) {
        res.redirect('/auth/ibmid');        
      } else next();
    }
  } else return function(req, res, next) {
    next();
  }
}

app.get('/admin', hasRole('admin'), function(req, res) {
  var msg = 'hello ';
  res.render('admin', {
      TITLE: 'Administrative Console',
      ACTIVE: 'admin',
      host: host,
      port: port,
      url: url,      
      "CLOUDANT_DATABASE": CLOUDANT_DATABASE,
      "CLOUDANT_URL": CLOUDANT_URL,
      "CLOUDANT_USERNAME": CLOUDANT_USERNAME,
      "CLOUDANT_PASSWORD": CLOUDANT_PASSWORD,      
      lastName: req.session.ibmid.profile.lastName,
      firstName: req.session.ibmid.profile.firstName,
      userId: req.session.ibmid.profile.userUniqueID,
      email: req.session.ibmid.profile['idaas.verified_email'],
      //*/
      msg: msg
  });  
});

app.get('/dashboard', hasRole('admin'), function(req, res) {
  console.log('*** entry /dashboard');
  var msg = 'hello ';
  res.render('dashboard', {
      TITLE: 'Dashboard',
      ACTIVE: 'dashboard',
      host: host,
      port: port,
      url: url,      
      lastName: req.session.ibmid.profile.lastName,
      firstName: req.session.ibmid.profile.firstName,
      userId: req.session.ibmid.profile.userUniqueID,
      email: req.session.ibmid.profile['idaas.verified_email'],
      //*/
      msg: msg
  });  
});


function authCloudantConn(url, db, user, pass) {
  var cloudantAuthCookie = {};
  var unauthNano = require('nano')(url);
  var authNano;
  var conn = function() {
    return authNano;
  }

  function reauth() {
    unauthNano.request({
      method: "POST",
      db: "_session",
      form: { name: user, password: pass },
      content_type: "application/x-www-form-urlencoded; charset=utf-8"
    }, function (err, body, headers) {
      if (err) { 
        console.log(err);
      }
      if (headers && headers['set-cookie']) {
        cloudantAuthCookie = headers['set-cookie'];
        authNano = require('nano')({ url : url + '/' + db, cookie: cloudantAuthCookie });
      } else {
        throw "failed to retrieve authsession cookie from cloudant";
      }
    });
  }
  reauth();
  setInterval(reauth, 60 * 60 * 1000);
  return conn;
}

function withCloudantConn(req, res, nxt) {
  var conn = cloudantConnPool();
  if (conn == undefined) {
    res.send('Cloudant service is not started yet, please wait and retry your request');
  } else { 
    return nxt(conn);
  }
}

var cloudantConnPool = authCloudantConn(CLOUDANT_URL, CLOUDANT_DATABASE, CLOUDANT_USERNAME, CLOUDANT_PASSWORD);
app.post('/cloudant', function(req, res) {
  var conn = cloudantConnPool();
  if (conn == undefined) {
    res.send('Cloudant service is not started yet, please wait and retry your request');
  } else { 
    conn.insert(req.body, function(err, body) {
      if (!err) {
        res.send(200, '');
      } else {
        res.send(500, JSON.stringify(err, undefined, 2));
      }
    });    
  }  
});

app.delete('/profile/:id/:rev', function(req, res) {
  withCloudantConn(req, res, function(conn) {
    console.log('*** entry with Cloudant Conn delete')
    conn.destroy(req.params.id, req.params.rev, function(err, body) {
      if (!err) {
        res.send(200,JSON.stringify(body, undefined, 2))
      } else {
        res.send(500, JSON.stringify(err, undefined, 2))
      }
    });  
  })
});

app.get('/profiles', function(req, res) {
  res.render('profiles', {
      "CLOUDANT_URL": CLOUDANT_URL,
      "CLOUDANT_DATABASE": CLOUDANT_DATABASE
  }); 
});

app.listen(port, host);
//------------------------------------------------------------------------------
// Copyright IBM Corp. 2014
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------