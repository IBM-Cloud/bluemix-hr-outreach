;(function(){

//----- --ang-tangle--.coffee
var AngTangle,
  __slice = [].slice;

AngTangle = {
  OneArgMethods: ["config", "run"],
  TwoArgMethods: ["animation", "constant", "controller", "directive", "factory", "filter", "provider", "service", "value"]
};

AngTangle.Init = (function() {
  function Init() {
    var getOneArgFunction, getTwoArgFunction, method, _i, _j, _len, _len1, _ref, _ref1;
    getOneArgFunction = function(module, method) {
      return function(thing) {
        if (module == null) {
          throw Error("module not defined in init script");
        }
        return module[method].call(module, thing);
      };
    };
    getTwoArgFunction = function(module, method) {
      return function(name, thing) {
        if (module == null) {
          throw Error("module not defined in init script");
        }
        return module[method].call(module, name, thing);
      };
    };
    _ref = AngTangle.OneArgMethods;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      method = _ref[_i];
      this[method] = getOneArgFunction(AngTangle.Module, method);
    }
    _ref1 = AngTangle.TwoArgMethods;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      method = _ref1[_j];
      this[method] = getTwoArgFunction(AngTangle.Module, method);
    }
  }

  Init.prototype.module = function() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    if (args.length !== 0) {
      if (AngTangle.Module != null) {
        throw Error("module() method called twice");
      }
      AngTangle.Module = angular.module.apply(angular, args);
    }
    return AngTangle.Module;
  };

  return Init;

})();

AngTangle.Script = (function() {
  function Script(module, scriptName) {
    var getOneArgFunction, getTwoArgFunction, method, _i, _j, _len, _len1, _ref, _ref1;
    this.module = module;
    this.scriptName = scriptName;
    getOneArgFunction = function(module, method) {
      return function(thing) {
        if (module == null) {
          throw Error("module not defined in init script");
        }
        return module[method].call(module, thing);
      };
    };
    getTwoArgFunction = function(module, method, scriptName) {
      return function(name, thing) {
        if (!thing) {
          thing = name;
          name = scriptName;
        }
        if (module == null) {
          throw Error("module not defined in init script");
        }
        return module[method].call(module, name, thing);
      };
    };
    _ref = AngTangle.OneArgMethods;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      method = _ref[_i];
      this[method] = getOneArgFunction(this.module, method);
    }
    _ref1 = AngTangle.TwoArgMethods;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      method = _ref1[_j];
      this[method] = getTwoArgFunction(this.module, method, this.scriptName);
    }
    return this;
  }

  Script.prototype.module = function() {
    return this.module;
  };

  return Script;

})();

//----- init.coffee
;(function(AngTangle) {
AngTangle.module("app", ["ngRoute", "ngResource"]);

})(new AngTangle.Init());
if (!AngTangle.Module) throw Error("the init script must call AngTangle.module(name, requires[, configFn]) to create the module")

//----- routes.coffee
;(function(AngTangle) {
AngTangle.config(function($routeProvider, views) {
  var addRoute;
  addRoute = function(name, url) {
    if (url == null) {
      url = "/" + name;
    }
    return $routeProvider.when(url, {
      controller: name,
      template: views["views/" + name]
    });
  };
  $routeProvider.otherwise({
    redirectTo: "/"
  });
  addRoute("home", "/");
  addRoute("coupon", "/coupon/:cid");
  addRoute("map", "/map/:lat,:lon");
  addRoute("mail");
  return addRoute("help");
});

})(new AngTangle.Script(AngTangle.Module, "routes"));

//----- services/Customers.coffee
;(function(AngTangle) {
var CustomersService;

AngTangle.service(CustomersService = (function() {
  function CustomersService(data, $resource) {
    this.CustomersResource = $resource("/api/customers");
    this.CustomerResource = $resource("/api/customers/:cid");
  }

  CustomersService.prototype.getCustomers = function() {
    return this.CustomersResource.query();
  };

  CustomersService.prototype.getCustomer = function(cid) {
    return this.CustomerResource.get({
      cid: cid
    });
  };

  return CustomersService;

})());

})(new AngTangle.Script(AngTangle.Module, "Customers"));

//----- services/GMap.coffee
;(function(AngTangle) {
var GMapLoaded, GMapService, Geocoder, InfoWindow, InfoWindowBusyHTML, InfoWindowErrorHTML, Map, Marker, MarkerLatLng, RootScope, Service, checkForGMapsLoaded, events, getGeocodeResult, init, initMap, main, onMarkerMoved, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

events = require("events");

_ = require("underscore");

Service = null;

GMapLoaded = false;

Geocoder = null;

InfoWindow = null;

Map = null;

Marker = null;

MarkerLatLng = null;

RootScope = null;

InfoWindowBusyHTML = "<div>\n    <p><p><p><p><p><p><p>\n</div>";

InfoWindowErrorHTML = "<div class='gmap-iw'>\n    <h5>adding location</h5>\n    <h3 class='gmap-iw-error'>invalid location</h3>\n</div>";

main = function() {
  return $(checkForGMapsLoaded());
};

AngTangle.service(GMapService = (function(_super) {
  __extends(GMapService, _super);

  function GMapService($window, $rootScope) {
    this.$window = $window;
    Service = this;
    RootScope = $rootScope;
  }

  GMapService.prototype.setMapElement = function() {
    return initMap();
  };

  GMapService.prototype.isLoaded = function() {
    return GMapLoaded;
  };

  GMapService.prototype.panTo = function(latlng) {
    if (Map != null) {
      Map.panTo(latlng);
    }
  };

  GMapService.prototype.triggerResize = function() {
    var _this = this;
    if (Map == null) {
      return;
    }
    process.nextTick(function() {
      google.maps.event.trigger(Map, "resize");
      return _this.panTo(Marker.getPosition());
    });
  };

  return GMapService;

})(events.EventEmitter));

init = function() {
  var e, storedLatLng;
  try {
    storedLatLng = JSON.parse(localStorage.getItem("LastMarkerLatLng"));
  } catch (_error) {
    e = _error;
  }
  if (storedLatLng != null) {
    MarkerLatLng = new google.maps.LatLng(storedLatLng.lat, storedLatLng.lng);
  } else {
    MarkerLatLng = new google.maps.LatLng(39.828221, -98.579505);
  }
  google.maps.visualRefresh = true;
  Geocoder = new google.maps.Geocoder();
  return InfoWindow = new google.maps.InfoWindow({
    content: InfoWindowBusyHTML
  });
};

initMap = function() {
  var mapElement, mapOptions;
  mapElement = $(".map-container")[0];
  mapOptions = {
    center: MarkerLatLng,
    zoom: 5,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    panControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.LEFT_CENTER
    }
  };
  Map = new google.maps.Map(mapElement, mapOptions);
  Marker = new google.maps.Marker({
    position: MarkerLatLng,
    map: Map,
    draggable: true,
    title: 'select a new us-weather location!'
  });
  onMarkerMoved(MarkerLatLng);
  google.maps.event.addListener(Marker, "dragend", function() {
    if (Service == null) {
      return;
    }
    return onMarkerMoved(Marker.getPosition());
  });
  google.maps.event.addListener(Map, "click", function(mouseEvent) {
    if (Service == null) {
      return;
    }
    return onMarkerMoved(mouseEvent.latLng);
  });
  InfoWindow.open(Map, Marker);
  return google.maps.event.addListener(InfoWindow, "closeclick", function() {
    return InfoWindow.open(Map, Marker);
  });
};

onMarkerMoved = function(latLng) {
  var storedLatLng;
  Marker.setPosition(latLng);
  Geocoder.geocode({
    latLng: latLng
  }, getGeocodeResult);
  storedLatLng = {
    lat: latLng.lat(),
    lng: latLng.lng()
  };
  return localStorage.setItem("LastMarkerLatLng", JSON.stringify(storedLatLng));
};

getGeocodeResult = function(result, status) {
  var address, addresses, area, areas, component, iContent, shortAddresses, state, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref;
  if (status !== "OK") {
    InfoWindow.setContent(InfoWindowErrorHTML);
    return;
  }
  addresses = _.filter(result, function(address) {
    var component, _i, _len, _ref;
    _ref = address.address_components;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      component = _ref[_i];
      if (component.types[0] !== "country") {
        continue;
      }
      if (component.types[1] !== "political") {
        continue;
      }
      if (component.short_name !== "US") {
        continue;
      }
      return true;
    }
    return false;
  });
  shortAddresses = [];
  for (_i = 0, _len = addresses.length; _i < _len; _i++) {
    address = addresses[_i];
    state = null;
    areas = [];
    _ref = address.address_components;
    for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
      component = _ref[_j];
      if (component.types[0] === "administrative_area_level_1") {
        state = component.short_name;
      }
      if (component.types[0] === "administrative_area_level_2") {
        if (component.short_name.length === 1) {
          continue;
        }
        areas.push(component.short_name);
      }
      if (component.types[0] === "administrative_area_level_3") {
        if (component.short_name.length === 1) {
          continue;
        }
        areas.push(component.short_name);
      }
      if (component.types[0] === "locality") {
        if (component.short_name.length === 1) {
          continue;
        }
        areas.push(component.short_name);
      }
    }
    if (state) {
      for (_k = 0, _len2 = areas.length; _k < _len2; _k++) {
        area = areas[_k];
        shortAddresses.push("" + area + ", " + state);
        shortAddresses.push("" + area);
      }
    }
  }
  addresses = shortAddresses;
  addresses = _.uniq(addresses);
  if (addresses.length === 0) {
    InfoWindow.setContent(InfoWindowErrorHTML);
    return;
  }
  iContent = [];
  iContent.push("<div class='gmap-iw'>\n    <h5>adding location</h5>\n    <h3>click one of the names to add the location</h3>");
  for (_l = 0, _len3 = addresses.length; _l < _len3; _l++) {
    address = addresses[_l];
    iContent.push("<button type='button'>" + address + "</button>");
  }
  iContent.push("</div>");
  InfoWindow.setContent(iContent.join("\n"));
  return RootScope != null ? RootScope.$broadcast("location-selected", "some data") : void 0;
};

checkForGMapsLoaded = function() {
  var _ref, _ref1;
  if (GMapLoaded) {
    return;
  }
  if ((typeof window !== "undefined" && window !== null ? (_ref = window.google) != null ? (_ref1 = _ref.maps) != null ? _ref1.version : void 0 : void 0 : void 0) != null) {
    GMapLoaded = true;
    init();
    return;
  }
  return setTimeout(checkForGMapsLoaded, 500);
};

main();

/*


//------------------------------------------------------------------------------
function getLocationName(latlng) {
    geocoder.geocode({'latLng': latlng}, getLocationNameResult)
}

//------------------------------------------------------------------------------
function getLocationNameResult(results, status) {
    if (status != "OK") {
        infoWindow.close()
        return
    }

    console.log("-------------------------------------------------------------")
    console.log("status:  " + JSON.stringify(status,  null, 4))

    html = []
    html.push("<p>select a location name")
    html.push("<p><input class='locationInput'>")
    html.push("<button class='locationAdd'>add</button>")
    html.push("<p><select selectedIndex='-1' size='" + results.length + "' class='locationSelector'>")

    for (var i=0; i<results.length; i++) {
        var address = results[i].formatted_address
        address = $('<div/>').text(address).html()

        html.push("<option>" + address + "</option>")
        console.log(i + ": " + address)
    }

    html.push("</select>")

    infoWindow.setContent(html.join("\n"))
    infoWindow.open(map, marker)

    $(".locationInput").val(results[0].formatted_address)

    $(".locationSelector").change(function(event){
        var index = event.target.selectedIndex
        var locName = results[index].formatted_address
        console.log("selected: " + locName)
        $(".locationInput").val(locName)
    })

    $(".locationAdd").click(function(thing){
        var locName = $(".locationInput").val()
        infoWindow.close()
        console.log("picked: " + locName)
    })
}
*/


})(new AngTangle.Script(AngTangle.Module, "GMap"));

//----- services/GMapStatic.coffee
;(function(AngTangle) {
var GMapStaticService;

AngTangle.service(GMapStaticService = (function() {
  function GMapStaticService() {}

  GMapStaticService.prototype.getMapURL = function(stations) {
    var mapURLbits, markerBits, station, _i, _len;
    mapURLbits = [];
    mapURLbits.push("http://maps.googleapis.com/maps/api/staticmap?sensor=false");
    mapURLbits.push("size=500x400");
    mapURLbits.push("visual_refresh=true");
    for (_i = 0, _len = stations.length; _i < _len; _i++) {
      station = stations[_i];
      markerBits = [];
      markerBits.push("color:red");
      markerBits.push("label:" + station.label);
      markerBits.push("" + station.lat + "," + station.lon);
      mapURLbits.push("markers=" + (markerBits.join('%7C')));
    }
    return mapURLbits.join("&");
  };

  return GMapStaticService;

})());

})(new AngTangle.Script(AngTangle.Module, "GMapStatic"));

//----- services/Locations.coffee
;(function(AngTangle) {
var LocationsService;

AngTangle.service(LocationsService = (function() {
  function LocationsService(data, $resource) {
    this.LocationsResource = $resource("/api/locations/:lat,:lon");
  }

  LocationsService.prototype.getStationsForLocation = function(_arg) {
    var lat, lon;
    lat = _arg.lat, lon = _arg.lon;
    return this.LocationsResource.query({
      lat: lat,
      lon: lon
    });
  };

  return LocationsService;

})());

})(new AngTangle.Script(AngTangle.Module, "Locations"));

//----- views/body.coffee
;(function(AngTangle) {
var body;

AngTangle.controller(body = function($scope, data) {
  var domReady, subTitle;
  domReady = false;
  $(function() {
    return domReady = true;
  });
  $scope.pkg = data["package"];
  subTitle = "";
  $scope.getSubtitle = function() {
    if (subTitle === "") {
      return "";
    }
    return ": " + subTitle;
  };
  $scope.setSubtitle = function(s) {
    return subTitle = s;
  };
  return $scope.$on("$routeChangeSuccess", function(next, current) {
    if (domReady) {
      return $(".navbar-collapse").collapse("hide");
    }
  });
});

})(new AngTangle.Script(AngTangle.Module, "body"));

//----- views/coupon.coffee
;(function(AngTangle) {
AngTangle.controller(function($scope, $routeParams, Customers) {
  $scope.setSubtitle("coupon");
  $scope.customer = Customers.getCustomer($routeParams.cid);
});

})(new AngTangle.Script(AngTangle.Module, "coupon"));

//----- views/help.coffee
;(function(AngTangle) {
AngTangle.controller(function($scope, data) {
  $scope.setSubtitle("help");
});

})(new AngTangle.Script(AngTangle.Module, "help"));

//----- views/home.coffee
;(function(AngTangle) {
var AllCustomers, isValidCID;

AllCustomers = null;

AngTangle.controller(function($scope, Customers) {
  $scope.setSubtitle("");
  AllCustomers = Customers.getCustomers();
  return $scope.showCoupon = function() {
    if (!isValidCID($scope.cid)) {
      alert("invalid Customer ID");
      return;
    }
    return window.location.href = "/#/coupon/" + $scope.cid;
  };
});

isValidCID = function(cid) {
  var customer, _i, _len;
  for (_i = 0, _len = AllCustomers.length; _i < _len; _i++) {
    customer = AllCustomers[_i];
    if (("" + customer.cid) === ("" + cid)) {
      return true;
    }
  }
  return false;
};

})(new AngTangle.Script(AngTangle.Module, "home"));

//----- views/mail.coffee
;(function(AngTangle) {
AngTangle.controller(function($scope, Customers) {
  var cindex;
  $scope.setSubtitle("mail");
  $scope.customers = Customers.getCustomers();
  cindex = 0;
  $scope.$watch("customers.length", function(vnew, vold) {
    if (vnew > 0) {
      return $scope.customer = $scope.customers[cindex];
    }
  });
  $scope.custPrev = function() {
    if (cindex <= 0) {
      cindex = $scope.customers.length - 1;
    } else {
      cindex--;
    }
    return $scope.customer = $scope.customers[cindex];
  };
  $scope.custNext = function() {
    if (cindex >= $scope.customers.length - 1) {
      cindex = 0;
    } else {
      cindex++;
    }
    return $scope.customer = $scope.customers[cindex];
  };
});

})(new AngTangle.Script(AngTangle.Module, "mail"));

//----- views/map.coffee
;(function(AngTangle) {
var setMapElement;

AngTangle.controller(function($scope, GMapStatic, $routeParams, Locations) {
  $scope.setSubtitle("map");
  $scope.gmapStatic = GMapStatic;
  $scope.locations = Locations;
  $scope.lat = $routeParams.lat;
  $scope.lon = $routeParams.lon;
  setMapElement($scope);
});

setMapElement = function($scope) {
  var lat, lon;
  lat = $scope.lat;
  lon = $scope.lon;
  $scope.stations = $scope.locations.getStationsForLocation({
    lat: lat,
    lon: lon
  });
  return $scope.$watch("stations.length", function(vnew, vold) {
    if (vnew > 0) {
      return $scope.mapURL = $scope.gmapStatic.getMapURL($scope.stations);
    }
  });
};

})(new AngTangle.Script(AngTangle.Module, "map"));

//----- --data--.coffee
;(function(AngTangle) {
AngTangle.constant('data', {
  "package": {
    "name": "bluemix-car-rally",
    "main": "./lib/server",
    "description": "the BlueMix Electric Car Rally demo",
    "version": "0.1.0",
    "dependencies": {
      "cf-env": "0.1.x",
      "concat-stream": "1.4.x",
      "express": "3.4.x",
      "nano": "5.7.x",
      "nopt": "2.2.x",
      "q": "1.0.x",
      "underscore": "1.6.x"
    },
    "devDependencies": {
      "ang-tangle": "0.1.x",
      "browserify": "3.33.x",
      "cat-source-map": "0.1.x",
      "coffee-script": "1.7.x",
      "mocha": "1.18.x",
      "expect.js": "0.3.x"
    }
  },
  "services/LocationsAustin": [
    {
      "ID": 5052,
      "UUID": "12140837-56F8-467E-BBCA-6D546CAC3389",
      "ParentChargePointID": null,
      "DataProviderID": 2,
      "DataProvider": {
        "WebsiteURL": "http://www.afdc.energy.gov/",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 20,
          "Title": "Automated Import"
        },
        "IsRestrictedEdit": false,
        "ID": 2,
        "Title": "afdc.energy.gov"
      },
      "DataProvidersReference": "40370",
      "OperatorID": 5,
      "OperatorInfo": {
        "WebsiteURL": "http://www.chargepoint.net/",
        "Comments": null,
        "PhonePrimaryContact": "1-888-758-4389",
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": false,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": "support@coulombtech.com",
        "FaultReportEmail": "support@coulombtech.com",
        "IsRestrictedEdit": null,
        "ID": 5,
        "Title": "ChargePoint (Coulomb Technologies)"
      },
      "OperatorsReference": null,
      "UsageTypeID": 2,
      "UsageType": {
        "IsPayAtLocation": null,
        "IsMembershipRequired": true,
        "IsAccessKeyRequired": null,
        "ID": 2,
        "Title": "Private - Restricted Access"
      },
      "UsageCost": null,
      "AddressInfo": {
        "ID": 4992,
        "Title": "PLUGNEVERYWHERE",
        "AddressLine1": "201 E 2nd St",
        "AddressLine2": null,
        "Town": "Austin",
        "StateOrProvince": "TX",
        "Postcode": "78701",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.263552,
        "Longitude": -97.742435,
        "ContactTelephone1": "888-758-4389",
        "ContactTelephone2": null,
        "ContactEmail": null,
        "AccessComments": "24 hours daily",
        "RelatedURL": "http://www.mychargepoint.net/",
        "Distance": 0.2508552603745602,
        "DistanceUnit": 2
      },
      "NumberOfPoints": null,
      "GeneralComments": null,
      "DatePlanned": null,
      "DateLastConfirmed": "2011-06-30T00:00:00",
      "StatusTypeID": 0,
      "StatusType": {
        "IsOperational": null,
        "IsUserSelectable": true,
        "ID": 0,
        "Title": "Unknown"
      },
      "DateLastStatusUpdate": "2014-02-06T06:25:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-07-27T11:31:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 100,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 100,
        "Title": "Imported and Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 3755,
          "ConnectionTypeID": 0,
          "ConnectionType": {
            "FormalName": "Not Specified",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 0,
            "Title": "Unknown"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 1,
          "Level": {
            "Comments": "Under 2 kW, usually domestic socket types",
            "IsFastChargeCapable": false,
            "ID": 1,
            "Title": "Level 1 : Low (Under 2kW)"
          },
          "Amps": null,
          "Voltage": 120,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 3,
          "Comments": null
        }, {
          "ID": 21045,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 3,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }, {
      "ID": 8345,
      "UUID": "D21342B5-1285-4EE6-A1F1-593DA49B6FF2",
      "ParentChargePointID": null,
      "DataProviderID": 15,
      "DataProvider": {
        "WebsiteURL": "http://www.carstations.com",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 20,
          "Title": "Automated Import"
        },
        "IsRestrictedEdit": false,
        "ID": 15,
        "Title": "CarStations.com"
      },
      "DataProvidersReference": "10878",
      "OperatorID": 5,
      "OperatorInfo": {
        "WebsiteURL": "http://www.chargepoint.net/",
        "Comments": null,
        "PhonePrimaryContact": "1-888-758-4389",
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": false,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": "support@coulombtech.com",
        "FaultReportEmail": "support@coulombtech.com",
        "IsRestrictedEdit": null,
        "ID": 5,
        "Title": "ChargePoint (Coulomb Technologies)"
      },
      "OperatorsReference": null,
      "UsageTypeID": 1,
      "UsageType": {
        "IsPayAtLocation": null,
        "IsMembershipRequired": null,
        "IsAccessKeyRequired": null,
        "ID": 1,
        "Title": "Public"
      },
      "UsageCost": null,
      "AddressInfo": {
        "ID": 8242,
        "Title": "710 Trinity St",
        "AddressLine1": "710 Trinity St",
        "AddressLine2": null,
        "Town": "Austin",
        "StateOrProvince": "Texas",
        "Postcode": "78701",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.26880455,
        "Longitude": -97.73914337,
        "ContactTelephone1": "",
        "ContactTelephone2": null,
        "ContactEmail": null,
        "AccessComments": null,
        "RelatedURL": "http://carstations.com/10878",
        "Distance": 0.2603969364771121,
        "DistanceUnit": 2
      },
      "NumberOfPoints": 1,
      "GeneralComments": null,
      "DatePlanned": null,
      "DateLastConfirmed": null,
      "StatusTypeID": 0,
      "StatusType": {
        "IsOperational": null,
        "IsUserSelectable": true,
        "ID": 0,
        "Title": "Unknown"
      },
      "DateLastStatusUpdate": "2014-03-19T04:42:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-11-11T12:06:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 100,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 100,
        "Title": "Imported and Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 5774,
          "ConnectionTypeID": 9,
          "ConnectionType": {
            "FormalName": null,
            "IsDiscontinued": false,
            "IsObsolete": false,
            "ID": 9,
            "Title": "NEMA 5-20R"
          },
          "Reference": "NEMA5",
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 1,
          "Level": {
            "Comments": "Under 2 kW, usually domestic socket types",
            "IsFastChargeCapable": false,
            "ID": 1,
            "Title": "Level 1 : Low (Under 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": null,
          "Comments": null
        }, {
          "ID": 6203,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": "J1772",
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": null,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }, {
      "ID": 8347,
      "UUID": "EFB3BF0A-0BFA-4807-AF42-318C913167D4",
      "ParentChargePointID": null,
      "DataProviderID": 15,
      "DataProvider": {
        "WebsiteURL": "http://www.carstations.com",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 20,
          "Title": "Automated Import"
        },
        "IsRestrictedEdit": false,
        "ID": 15,
        "Title": "CarStations.com"
      },
      "DataProvidersReference": "10732",
      "OperatorID": 5,
      "OperatorInfo": {
        "WebsiteURL": "http://www.chargepoint.net/",
        "Comments": null,
        "PhonePrimaryContact": "1-888-758-4389",
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": false,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": "support@coulombtech.com",
        "FaultReportEmail": "support@coulombtech.com",
        "IsRestrictedEdit": null,
        "ID": 5,
        "Title": "ChargePoint (Coulomb Technologies)"
      },
      "OperatorsReference": null,
      "UsageTypeID": 1,
      "UsageType": {
        "IsPayAtLocation": null,
        "IsMembershipRequired": null,
        "IsAccessKeyRequired": null,
        "ID": 1,
        "Title": "Public"
      },
      "UsageCost": null,
      "AddressInfo": {
        "ID": 8244,
        "Title": "201 E 2nd St",
        "AddressLine1": "201 E 2nd St",
        "AddressLine2": null,
        "Town": "Austin",
        "StateOrProvince": "Texas",
        "Postcode": "78701",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.26372337,
        "Longitude": -97.74052429,
        "ContactTelephone1": "",
        "ContactTelephone2": null,
        "ContactEmail": null,
        "AccessComments": null,
        "RelatedURL": "http://carstations.com/10732",
        "Distance": 0.2807387341868533,
        "DistanceUnit": 2
      },
      "NumberOfPoints": 1,
      "GeneralComments": null,
      "DatePlanned": null,
      "DateLastConfirmed": null,
      "StatusTypeID": 0,
      "StatusType": {
        "IsOperational": null,
        "IsUserSelectable": true,
        "ID": 0,
        "Title": "Unknown"
      },
      "DateLastStatusUpdate": "2014-03-19T04:42:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-11-11T12:06:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 100,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 100,
        "Title": "Imported and Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 5776,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": "J1772",
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": null,
          "Comments": null
        }, {
          "ID": 6378,
          "ConnectionTypeID": 9,
          "ConnectionType": {
            "FormalName": null,
            "IsDiscontinued": false,
            "IsObsolete": false,
            "ID": 9,
            "Title": "NEMA 5-20R"
          },
          "Reference": "NEMA5",
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 1,
          "Level": {
            "Comments": "Under 2 kW, usually domestic socket types",
            "IsFastChargeCapable": false,
            "ID": 1,
            "Title": "Level 1 : Low (Under 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": null,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }, {
      "ID": 4339,
      "UUID": "FF9476F2-D176-4875-96EC-D6A42D5ECCDE",
      "ParentChargePointID": null,
      "DataProviderID": 2,
      "DataProvider": {
        "WebsiteURL": "http://www.afdc.energy.gov/",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 20,
          "Title": "Automated Import"
        },
        "IsRestrictedEdit": false,
        "ID": 2,
        "Title": "afdc.energy.gov"
      },
      "DataProvidersReference": "38993",
      "OperatorID": 5,
      "OperatorInfo": {
        "WebsiteURL": "http://www.chargepoint.net/",
        "Comments": null,
        "PhonePrimaryContact": "1-888-758-4389",
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": false,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": "support@coulombtech.com",
        "FaultReportEmail": "support@coulombtech.com",
        "IsRestrictedEdit": null,
        "ID": 5,
        "Title": "ChargePoint (Coulomb Technologies)"
      },
      "OperatorsReference": null,
      "UsageTypeID": 2,
      "UsageType": {
        "IsPayAtLocation": null,
        "IsMembershipRequired": true,
        "IsAccessKeyRequired": null,
        "ID": 2,
        "Title": "Private - Restricted Access"
      },
      "UsageCost": null,
      "AddressInfo": {
        "ID": 4338,
        "Title": "PLUGNEVERYWHERE",
        "AddressLine1": "301 W 2nd St",
        "AddressLine2": null,
        "Town": "Austin",
        "StateOrProvince": "TX",
        "Postcode": "78701",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.2648963,
        "Longitude": -97.747196,
        "ContactTelephone1": "888-758-4389",
        "ContactTelephone2": null,
        "ContactEmail": null,
        "AccessComments": "24 hours daily",
        "RelatedURL": "http://www.mychargepoint.net/",
        "Distance": 0.29206234354466615,
        "DistanceUnit": 2
      },
      "NumberOfPoints": null,
      "GeneralComments": null,
      "DatePlanned": null,
      "DateLastConfirmed": "2011-06-30T00:00:00",
      "StatusTypeID": 0,
      "StatusType": {
        "IsOperational": null,
        "IsUserSelectable": true,
        "ID": 0,
        "Title": "Unknown"
      },
      "DateLastStatusUpdate": "2014-02-06T06:27:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-05-09T14:58:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 100,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 100,
        "Title": "Imported and Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 3489,
          "ConnectionTypeID": 0,
          "ConnectionType": {
            "FormalName": "Not Specified",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 0,
            "Title": "Unknown"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 1,
          "Level": {
            "Comments": "Under 2 kW, usually domestic socket types",
            "IsFastChargeCapable": false,
            "ID": 1,
            "Title": "Level 1 : Low (Under 2kW)"
          },
          "Amps": null,
          "Voltage": 120,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 2,
          "Comments": null
        }, {
          "ID": 20672,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 2,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }, {
      "ID": 5693,
      "UUID": "7AD1D6CE-8A92-4D17-B678-8071721F3B9D",
      "ParentChargePointID": null,
      "DataProviderID": 1,
      "DataProvider": {
        "WebsiteURL": "http://openchargemap.org",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 1,
          "Title": "Manual Data Entry"
        },
        "IsRestrictedEdit": false,
        "ID": 1,
        "Title": "Open Charge Map Contributor"
      },
      "DataProvidersReference": null,
      "OperatorID": 1,
      "OperatorInfo": {
        "WebsiteURL": null,
        "Comments": null,
        "PhonePrimaryContact": null,
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": null,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": null,
        "FaultReportEmail": null,
        "IsRestrictedEdit": null,
        "ID": 1,
        "Title": "(Unknown Operator)"
      },
      "OperatorsReference": null,
      "UsageTypeID": 1,
      "UsageType": {
        "IsPayAtLocation": null,
        "IsMembershipRequired": null,
        "IsAccessKeyRequired": null,
        "ID": 1,
        "Title": "Public"
      },
      "UsageCost": null,
      "AddressInfo": {
        "ID": 5615,
        "Title": "Mellow Johnny's Bike Shop",
        "AddressLine1": "400 Nueces St.",
        "AddressLine2": "",
        "Town": "Austin",
        "StateOrProvince": "TX",
        "Postcode": "78701",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.268109,
        "Longitude": -97.749269,
        "ContactTelephone1": "+1 512 473-0222",
        "ContactTelephone2": null,
        "ContactEmail": "",
        "AccessComments": "AeroVironment EVSE, free access",
        "RelatedURL": null,
        "Distance": 0.37699833495988744,
        "DistanceUnit": 2
      },
      "NumberOfPoints": 1,
      "GeneralComments": "Verified free & operational in Jul 2011",
      "DatePlanned": null,
      "DateLastConfirmed": "2011-09-09T04:19:00",
      "StatusTypeID": 50,
      "StatusType": {
        "IsOperational": true,
        "IsUserSelectable": true,
        "ID": 50,
        "Title": "Operational"
      },
      "DateLastStatusUpdate": "2011-09-09T04:19:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-09-09T04:19:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 200,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 200,
        "Title": "Submission Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 442,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": null,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }, {
      "ID": 8346,
      "UUID": "BF3C4B16-8469-44FF-9A2F-29DA6F00B91B",
      "ParentChargePointID": null,
      "DataProviderID": 15,
      "DataProvider": {
        "WebsiteURL": "http://www.carstations.com",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 20,
          "Title": "Automated Import"
        },
        "IsRestrictedEdit": false,
        "ID": 15,
        "Title": "CarStations.com"
      },
      "DataProvidersReference": "11192",
      "OperatorID": 5,
      "OperatorInfo": {
        "WebsiteURL": "http://www.chargepoint.net/",
        "Comments": null,
        "PhonePrimaryContact": "1-888-758-4389",
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": false,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": "support@coulombtech.com",
        "FaultReportEmail": "support@coulombtech.com",
        "IsRestrictedEdit": null,
        "ID": 5,
        "Title": "ChargePoint (Coulomb Technologies)"
      },
      "OperatorsReference": null,
      "UsageTypeID": null,
      "UsageType": null,
      "UsageCost": null,
      "AddressInfo": {
        "ID": 8243,
        "Title": "1601 N Interstate 35",
        "AddressLine1": "1601 N Interstate 35",
        "AddressLine2": null,
        "Town": "Austin",
        "StateOrProvince": "Texas",
        "Postcode": "78702",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.26498985,
        "Longitude": -97.73420715,
        "ContactTelephone1": "",
        "ContactTelephone2": null,
        "ContactEmail": null,
        "AccessComments": null,
        "RelatedURL": "http://carstations.com/11192",
        "Distance": 0.5499584804546591,
        "DistanceUnit": 2
      },
      "NumberOfPoints": null,
      "GeneralComments": null,
      "DatePlanned": null,
      "DateLastConfirmed": null,
      "StatusTypeID": 0,
      "StatusType": {
        "IsOperational": null,
        "IsUserSelectable": true,
        "ID": 0,
        "Title": "Unknown"
      },
      "DateLastStatusUpdate": "2014-03-19T04:42:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-11-11T12:06:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 100,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 100,
        "Title": "Imported and Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 5775,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": "J1772",
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": null,
          "Comments": null
        }, {
          "ID": 6644,
          "ConnectionTypeID": 9,
          "ConnectionType": {
            "FormalName": null,
            "IsDiscontinued": false,
            "IsObsolete": false,
            "ID": 9,
            "Title": "NEMA 5-20R"
          },
          "Reference": "NEMA5",
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 1,
          "Level": {
            "Comments": "Under 2 kW, usually domestic socket types",
            "IsFastChargeCapable": false,
            "ID": 1,
            "Title": "Level 1 : Low (Under 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": null,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }, {
      "ID": 4342,
      "UUID": "BBD3F7E1-65BC-4A43-93AE-76C7CED4B23C",
      "ParentChargePointID": null,
      "DataProviderID": 2,
      "DataProvider": {
        "WebsiteURL": "http://www.afdc.energy.gov/",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 20,
          "Title": "Automated Import"
        },
        "IsRestrictedEdit": false,
        "ID": 2,
        "Title": "afdc.energy.gov"
      },
      "DataProvidersReference": "38996",
      "OperatorID": 5,
      "OperatorInfo": {
        "WebsiteURL": "http://www.chargepoint.net/",
        "Comments": null,
        "PhonePrimaryContact": "1-888-758-4389",
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": false,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": "support@coulombtech.com",
        "FaultReportEmail": "support@coulombtech.com",
        "IsRestrictedEdit": null,
        "ID": 5,
        "Title": "ChargePoint (Coulomb Technologies)"
      },
      "OperatorsReference": null,
      "UsageTypeID": 2,
      "UsageType": {
        "IsPayAtLocation": null,
        "IsMembershipRequired": true,
        "IsAccessKeyRequired": null,
        "ID": 2,
        "Title": "Private - Restricted Access"
      },
      "UsageCost": null,
      "AddressInfo": {
        "ID": 4341,
        "Title": "PLUGNEVERYWHERE",
        "AddressLine1": "600 River St",
        "AddressLine2": null,
        "Town": "Austin",
        "StateOrProvince": "TX",
        "Postcode": "78701",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.2581564,
        "Longitude": -97.7400431,
        "ContactTelephone1": "888-758-4389",
        "ContactTelephone2": null,
        "ContactEmail": null,
        "AccessComments": "24 hours daily",
        "RelatedURL": "http://www.mychargepoint.net/",
        "Distance": 0.6454510897904353,
        "DistanceUnit": 2
      },
      "NumberOfPoints": null,
      "GeneralComments": null,
      "DatePlanned": null,
      "DateLastConfirmed": "2011-06-30T00:00:00",
      "StatusTypeID": 0,
      "StatusType": {
        "IsOperational": null,
        "IsUserSelectable": true,
        "ID": 0,
        "Title": "Unknown"
      },
      "DateLastStatusUpdate": "2014-02-06T06:25:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-05-09T14:58:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 100,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 100,
        "Title": "Imported and Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 3492,
          "ConnectionTypeID": 0,
          "ConnectionType": {
            "FormalName": "Not Specified",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 0,
            "Title": "Unknown"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 1,
          "Level": {
            "Comments": "Under 2 kW, usually domestic socket types",
            "IsFastChargeCapable": false,
            "ID": 1,
            "Title": "Level 1 : Low (Under 2kW)"
          },
          "Amps": null,
          "Voltage": 120,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 2,
          "Comments": null
        }, {
          "ID": 22502,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 2,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }, {
      "ID": 2951,
      "UUID": "99E5F0DD-EB42-4812-A01E-AC4525D0400A",
      "ParentChargePointID": null,
      "DataProviderID": 2,
      "DataProvider": {
        "WebsiteURL": "http://www.afdc.energy.gov/",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 20,
          "Title": "Automated Import"
        },
        "IsRestrictedEdit": false,
        "ID": 2,
        "Title": "afdc.energy.gov"
      },
      "DataProvidersReference": "36375",
      "OperatorID": 5,
      "OperatorInfo": {
        "WebsiteURL": "http://www.chargepoint.net/",
        "Comments": null,
        "PhonePrimaryContact": "1-888-758-4389",
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": false,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": "support@coulombtech.com",
        "FaultReportEmail": "support@coulombtech.com",
        "IsRestrictedEdit": null,
        "ID": 5,
        "Title": "ChargePoint (Coulomb Technologies)"
      },
      "OperatorsReference": null,
      "UsageTypeID": 2,
      "UsageType": {
        "IsPayAtLocation": null,
        "IsMembershipRequired": true,
        "IsAccessKeyRequired": null,
        "ID": 2,
        "Title": "Private - Restricted Access"
      },
      "UsageCost": null,
      "AddressInfo": {
        "ID": 2952,
        "Title": "WHOLE FOODS MKT",
        "AddressLine1": "525 N Lamar Blvd",
        "AddressLine2": null,
        "Town": "Austin",
        "StateOrProvince": "TX",
        "Postcode": "78703",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.2711792,
        "Longitude": -97.7537842,
        "ContactTelephone1": "888-758-4389",
        "ContactTelephone2": null,
        "ContactEmail": null,
        "AccessComments": "24 hours daily",
        "RelatedURL": "http://www.mychargepoint.net/",
        "Distance": 0.6985777277618764,
        "DistanceUnit": 2
      },
      "NumberOfPoints": null,
      "GeneralComments": null,
      "DatePlanned": null,
      "DateLastConfirmed": "2011-04-30T00:00:00",
      "StatusTypeID": 0,
      "StatusType": {
        "IsOperational": null,
        "IsUserSelectable": true,
        "ID": 0,
        "Title": "Unknown"
      },
      "DateLastStatusUpdate": "2014-02-06T06:27:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-04-30T00:00:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 100,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 100,
        "Title": "Imported and Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 15358,
          "ConnectionTypeID": 0,
          "ConnectionType": {
            "FormalName": "Not Specified",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 0,
            "Title": "Unknown"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 1,
          "Level": {
            "Comments": "Under 2 kW, usually domestic socket types",
            "IsFastChargeCapable": false,
            "ID": 1,
            "Title": "Level 1 : Low (Under 2kW)"
          },
          "Amps": null,
          "Voltage": 120,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 1,
          "Comments": null
        }, {
          "ID": 15359,
          "ConnectionTypeID": 0,
          "ConnectionType": {
            "FormalName": "Not Specified",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 0,
            "Title": "Unknown"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 1,
          "Comments": null
        }, {
          "ID": 20333,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 1,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }, {
      "ID": 5054,
      "UUID": "493E5123-078B-4A29-9F29-64CA90C01F94",
      "ParentChargePointID": null,
      "DataProviderID": 2,
      "DataProvider": {
        "WebsiteURL": "http://www.afdc.energy.gov/",
        "Comments": null,
        "DataProviderStatusType": {
          "IsProviderEnabled": true,
          "ID": 20,
          "Title": "Automated Import"
        },
        "IsRestrictedEdit": false,
        "ID": 2,
        "Title": "afdc.energy.gov"
      },
      "DataProvidersReference": "40372",
      "OperatorID": 5,
      "OperatorInfo": {
        "WebsiteURL": "http://www.chargepoint.net/",
        "Comments": null,
        "PhonePrimaryContact": "1-888-758-4389",
        "PhoneSecondaryContact": null,
        "IsPrivateIndividual": false,
        "AddressInfo": null,
        "BookingURL": null,
        "ContactEmail": "support@coulombtech.com",
        "FaultReportEmail": "support@coulombtech.com",
        "IsRestrictedEdit": null,
        "ID": 5,
        "Title": "ChargePoint (Coulomb Technologies)"
      },
      "OperatorsReference": null,
      "UsageTypeID": 2,
      "UsageType": {
        "IsPayAtLocation": null,
        "IsMembershipRequired": true,
        "IsAccessKeyRequired": null,
        "ID": 2,
        "Title": "Private - Restricted Access"
      },
      "UsageCost": null,
      "AddressInfo": {
        "ID": 4994,
        "Title": "PLUGNEVERYWHERE",
        "AddressLine1": "505 Barton Springs Rd",
        "AddressLine2": null,
        "Town": "Austin",
        "StateOrProvince": "TX",
        "Postcode": "78704",
        "CountryID": 2,
        "Country": {
          "ISOCode": "US",
          "ID": 2,
          "Title": "United States"
        },
        "Latitude": 30.2572701,
        "Longitude": -97.7492982,
        "ContactTelephone1": "888-758-4389",
        "ContactTelephone2": null,
        "ContactEmail": null,
        "AccessComments": "24 hours daily",
        "RelatedURL": "http://www.mychargepoint.net/",
        "Distance": 0.7762400851933166,
        "DistanceUnit": 2
      },
      "NumberOfPoints": null,
      "GeneralComments": null,
      "DatePlanned": null,
      "DateLastConfirmed": "2011-06-30T00:00:00",
      "StatusTypeID": 0,
      "StatusType": {
        "IsOperational": null,
        "IsUserSelectable": true,
        "ID": 0,
        "Title": "Unknown"
      },
      "DateLastStatusUpdate": "2014-02-06T06:27:00",
      "DataQualityLevel": 1,
      "DateCreated": "2011-07-27T11:31:00",
      "Contributor": null,
      "SubmissionStatusTypeID": 100,
      "SubmissionStatus": {
        "IsLive": true,
        "ID": 100,
        "Title": "Imported and Published"
      },
      "UserComments": null,
      "PercentageSimilarity": null,
      "Connections": [
        {
          "ID": 3757,
          "ConnectionTypeID": 0,
          "ConnectionType": {
            "FormalName": "Not Specified",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 0,
            "Title": "Unknown"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 1,
          "Level": {
            "Comments": "Under 2 kW, usually domestic socket types",
            "IsFastChargeCapable": false,
            "ID": 1,
            "Title": "Level 1 : Low (Under 2kW)"
          },
          "Amps": null,
          "Voltage": 120,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 3,
          "Comments": null
        }, {
          "ID": 21047,
          "ConnectionTypeID": 1,
          "ConnectionType": {
            "FormalName": "SAE J1772-2009",
            "IsDiscontinued": null,
            "IsObsolete": null,
            "ID": 1,
            "Title": "J1772"
          },
          "Reference": null,
          "StatusTypeID": null,
          "StatusType": null,
          "LevelID": 2,
          "Level": {
            "Comments": "Over 2 kW, usually non-domestic socket type",
            "IsFastChargeCapable": false,
            "ID": 2,
            "Title": "Level 2 : Medium (Over 2kW)"
          },
          "Amps": null,
          "Voltage": null,
          "PowerKW": null,
          "CurrentTypeID": null,
          "CurrentType": null,
          "Quantity": 3,
          "Comments": null
        }
      ],
      "MediaItems": null,
      "MetadataValues": null
    }
  ]
});

})(new AngTangle.Script(AngTangle.Module, "--data--"));

//----- --views--.coffee
;(function(AngTangle) {
AngTangle.constant('views', {
  "views/coupon": "<!-- Licensed under the Apache License. See footer for details. -->\n\n<h3>here's your coupon</h3>\n\n<p>Thanks for participating in the Electric Car Rally, {{customer.name}}.\n\n<p>Click <a href=\"#/map/{{customer.lat}},{{customer.lon}}\">here</a> for a map\nof participating charging stations in {{customer.city}}, {{customer.st}}.\n\n<p>&nbsp;\n\n<img src=\"images/gift-coupon.jpg\" width=\"100%\">\n\n<!--\n#===============================================================================\n# Copyright IBM Corp. 2014\n#\n# Licensed under the Apache License, Version 2.0 (the \"License\");\n# you may not use this file except in compliance with the License.\n# You may obtain a copy of the License at\n#\n#    http://www.apache.org/licenses/LICENSE-2.0\n#\n# Unless required by applicable law or agreed to in writing, software\n# distributed under the License is distributed on an \"AS IS\" BASIS,\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n# See the License for the specific language governing permissions and\n# limitations under the License.\n#===============================================================================\n-->",
  "views/help": "<!-- Licensed under the Apache License. See footer for details. -->\n\n<img src=\"images/bluemix-icon.png\" class=\"pull-right\" width=128 height=128>\n\n<!-- ======================================================================= -->\n<h2>source</h2>\n\n<p>fork me at\n<a href=\"http://example.com\">TODO: PUT REPO URL HERE</a>\n\n<!-- ======================================================================= -->\n<h2>attributions</h2>\n\n<p>Data on car charging locations comes from\n<a href=\"http://openchargemap.org/site/\">Open Charge Map</a>.\n\n<p>The mapping capability comes from the\n<a href=\"https://developers.google.com/maps/documentation/staticmaps/\">Google Static Maps API</a>.\n\n<p>The coupon template came from\n<a href=\"http://www.giftninja.com/templates/\">GiftNinja.com</a>.\n\n<p>The sample customer name data was generated from\n<a href=\"http://www.generatedata.com/\">generatedata.com</a>.\n\n<p>The sample city/state/geo data was generated from the\n<a href=\"http://graphical.weather.gov/xml/rest.php\">US National Weather Service</a>.\n\n<!-- ======================================================================= -->\n<h2>version</h2>\n\n<p>package: {{pkg.name}}, version: {{pkg.version}}\n\n<!--\n#===============================================================================\n# Copyright IBM Corp. 2014\n#\n# Licensed under the Apache License, Version 2.0 (the \"License\");\n# you may not use this file except in compliance with the License.\n# You may obtain a copy of the License at\n#\n#    http://www.apache.org/licenses/LICENSE-2.0\n#\n# Unless required by applicable law or agreed to in writing, software\n# distributed under the License is distributed on an \"AS IS\" BASIS,\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n# See the License for the specific language governing permissions and\n# limitations under the License.\n#===============================================================================\n-->",
  "views/home": "<!-- Licensed under the Apache License. See footer for details. -->\n\n<h3>Want a Free Charge?</h3>\n\n<p>Welcome to the BlueMix Electric Car Rally!\n\n<p>Enter your customer id here to get your coupon for a free hour\nof charging your car.\n\n<form role=\"form\" name=\"form\" novalidate>\n    <div class=\"form-group\">\n        <input ng-model=\"cid\" class=\"form-control\" placeholder=\"Enter Customer ID\">\n    </div>\n    <button\n    \tng-click=\"showCoupon()\"\n    \tng-disabled=\"form.$invalid\"\n    \ttype=\"submit\" class=\"cid-button btn btn-default\">Display Coupon</button>\n</form>\n\n<!--\n#===============================================================================\n# Copyright IBM Corp. 2014\n#\n# Licensed under the Apache License, Version 2.0 (the \"License\");\n# you may not use this file except in compliance with the License.\n# You may obtain a copy of the License at\n#\n#    http://www.apache.org/licenses/LICENSE-2.0\n#\n# Unless required by applicable law or agreed to in writing, software\n# distributed under the License is distributed on an \"AS IS\" BASIS,\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n# See the License for the specific language governing permissions and\n# limitations under the License.\n#===============================================================================\n-->",
  "views/mail": "<!-- Licensed under the Apache License. See footer for details. -->\n\n<!-- ======================================================================= -->\n<h3>sample email to customer</h3>\n\n<!-- ======================================================================= -->\n<div class=\"email\">\n\t<table>\n\t\t<tr><td>from:    <td>BlueMix Car Rally\n\t\t<tr><td>to:      <td>{{customer.name}}\n\t\t<tr><td>subject: <td>Charge your car for free!\n\t</table>\n\n\t<p>&nbsp;\n\n\t<p>You might be interested in our BlueMix Electric Car Rally,\n\tas we're offering a free hour charge at a participating charger\n\tin the {{customer.city}}, {{customer.st}} area.\n\n\t<p>Click <a href=\"#/coupon/{{customer.cid}}\">here</a> for\n\tyour coupon.\n\n\t<p>We look forward to seeing you!\n</div>\n\n<!-- ======================================================================= -->\n<center>\n\t<div class=\"btn-group\">\n\t    <button ng-click=\"custPrev()\" type=\"button\" class=\"btn btn-default btn-lg\">\n\t    \t<span class=\"glyphicon glyphicon-arrow-left\"></span>\n\t    </button>\n\t    <button ng-click=\"custNext()\" type=\"button\" class=\"btn btn-default btn-lg\">\n\t    \t<span class=\"glyphicon glyphicon-arrow-right\"></span>\n\t    </button>\n\t</div>\n</center>\n\n\n\n<!--\n#===============================================================================\n# Copyright IBM Corp. 2014\n#\n# Licensed under the Apache License, Version 2.0 (the \"License\");\n# you may not use this file except in compliance with the License.\n# You may obtain a copy of the License at\n#\n#    http://www.apache.org/licenses/LICENSE-2.0\n#\n# Unless required by applicable law or agreed to in writing, software\n# distributed under the License is distributed on an \"AS IS\" BASIS,\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n# See the License for the specific language governing permissions and\n# limitations under the License.\n#===============================================================================\n-->",
  "views/map": "<!-- Licensed under the Apache License. See footer for details. -->\n\n<h2>Charge Locations Near You</h2>\n\n<div class=\"container-fluid\">\n\t<div class=\"row\">\n\t\t<div class=\"col-xs-12 col-sm-12 col-md-4 col-lg-4\">\n\t\t\t<h3>stations</h3>\n\n\t\t\t<div ng-show=\"stations\" ng-repeat=\"station in stations\">\n\t\t\t\t<b>{{station.label}}: <a href=\"{{station.operator.url}}\">{{station.operator.title}}</a></b>\n\t\t\t\t<div style=\"margin-left:2em;\">\n\t\t\t\t\t{{station.address.street}}\n\t\t\t\t\t<br/>\n\t\t\t\t\t{{station.address.town}}, {{station.address.state}}\n\t\t\t    </div>\n\t\t\t</div>\n\t\t</div>\n\n\t\t<div class=\"col-xs-12 col-sm-12 col-md-8 col-lg-8\">\n\t\t\t<h3>map</h3>\n\n\t\t\t<img ng-show=\"mapURL\" ng-src=\"{{mapURL}}\" width=\"100%\">\n\t\t</div>\n\t</div>\n</div>\n\n<!--\n#===============================================================================\n# Copyright IBM Corp. 2014\n#\n# Licensed under the Apache License, Version 2.0 (the \"License\");\n# you may not use this file except in compliance with the License.\n# You may obtain a copy of the License at\n#\n#    http://www.apache.org/licenses/LICENSE-2.0\n#\n# Unless required by applicable law or agreed to in writing, software\n# distributed under the License is distributed on an \"AS IS\" BASIS,\n# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.\n# See the License for the specific language governing permissions and\n# limitations under the License.\n#===============================================================================\n-->"
});

})(new AngTangle.Script(AngTangle.Module, "--views--"));


})();
//# sourceMappingURL=index.js.map.json
