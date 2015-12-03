/**
 * Enhanced Compass for Mazda Connect Infotainment
 * 
 * This is a full replacement for the standard Compass Application that also offers a moving map.
 *
 * Written by Andreas Schwarz (http://github.com/flyandi/mazda-enhanced-compass)
 * Copyright (c) 2015. All rights reserved.
 * 
 * WARNING: The installation of this application requires modifications to your Mazda Connect system.
 * If you don't feel comfortable performing these changes, please do not attempt to install this. You might
 * be ending up with an unusuable system that requires reset by your Dealer. You were warned!
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the 
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even 
 * the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
 * License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. 
 * If not, see http://www.gnu.org/licenses/
 *
 */

var __NavPOICtrl;

/**
 * (constructor)
 */

function NavCtrl(uiaId, parentDiv, ctrlId) {

    this.id = ctrlId;
    this.parentDiv = parentDiv;
    this.uiaId = uiaId;
    this.hasMap = false;
    this.hasUI = false;
    this.hasPOI = false;
    this.lastDirection = false;
    this.geoLocationProvider = new MazdaGeoProvider();

    __NavPOICtrl = this;

    // run
    this.load();

};

/**
 * Prototype
 */

NavCtrl.prototype = {

    /**
     * (locals)
     */

    _initialized: false,

    // Paths

//    _PATH: 'apps/emnavi/controls/Compass/resources/',
_PATH: '../',

    // Vendor prefix
        _VENDOR: ('opera' in window) ? 'O' : 'webkit',

        /**
           	 * (framework)
           	 */

            cleanUp: function() {

                // empty

            },

    /**
     * (init) init routines
     */

    load: function() {

        // check for initialization
        if(this._initialized) return;
        
        this.addCss("system/css/demo.css");
        this.addCss("system/css/components/components.css");
        this.addCss("system/vendor/leaflet/leaflet.css");

        // Container element
        this.ctrlDiv = document.createElement('div');
        this.ctrlDiv.id = this.id;
        this.ctrlDiv.className = 'NavCtrl';
        this.parentDiv.appendChild(this.ctrlDiv);
        this.buildHtml(this.ctrlDiv);
        
        this._initialized = true;

/*
       var s = document.createElement('script');
          s.type = 'text/javascript';
          var code = '$(function() {init();})';
          try {
            s.appendChild(document.createTextNode(code));
            document.body.appendChild(s);
          } catch (e) {
            s.text = code;
            document.body.appendChild(s);
          }
          */
          init();
    },

    /**
         * (hooks) methods
         */

        setLocationData: function(location) {
          this.geoLocationProvider.onGpsChanged(location);
        },

    addCss: function(path){
        var elm = document.createElement('link');
        elm.rel = "stylesheet";
        elm.type = "text/css";
        elm.href = this._PATH + path;
        document.body.appendChild(elm);
    },

     addJs: function(path){
        var elm = document.createElement('script');
        elm.type = "application/javascript";
        elm.src = this._PATH + path;
        document.body.appendChild(elm);
        },


    buildHtml: function(ctrlDiv){
      this.addJs("system/vendor/jquery-1.11.3.min.js");
      this.addJs("system/js/ffwdme-core.js");
      this.addJs("system/js/ffwdme-components.js");
      this.addJs("system/js/credentials.js");
      //this.addJs("system/js/app.js");
      this.addJs("system/vendor/zepto/zepto.js");
      this.addJs("system/vendor/leaflet/leaflet-src.js");

      this.ctrlLoader = document.createElement('div');
      this.ctrlLoader.id = "loader";
      var textn = document.createTextNode("Wait for geolocation...");
      this.ctrlLoader.appendChild(textn);
      this.ctrlDiv.appendChild(this.ctrlLoader);

   // create map
      this.ctrlMap = document.createElement('div');
      this.ctrlMap.id = "map";
      this.ctrlDiv.appendChild(this.ctrlMap);

      this.ctrlPlayground = document.createElement('div');
      this.ctrlPlayground.id = "playground";
      this.ctrlPlayground.class = "ffwdme-components-wrapper";
      this.ctrlDiv.appendChild(this.ctrlPlayground);
    }
   }; 
    
    // app.js
    function init() {
  ffwdme.on('geoposition:init', function() {
    console.info("Waiting for initial geoposition...");
  });

  ffwdme.on('geoposition:ready', function() {
    console.info("Received initial geoposition!");
    $('#loader').remove();
  });

  // setup ffwdme
  ffwdme.initialize({
    routing: 'GraphHopper',
    graphHopper: {
      apiKey: CREDENTIALS.graphHopper
    },
    geoProvider: __NavPOICtrl.geoLocationProvider
  });

  var tileURL = "https://api.tiles.mapbox.com/v4/" + CREDENTIALS.mapboxId + "/{z}/{x}/{y}.png?access_token=" + CREDENTIALS.mapboxToken;
  var map = new ffwdme.components.Leaflet({ el: $('#map'), tileURL: tileURL, center: { lat: 49.90179, lng: 8.85723 } });

  var audioData = {"file": ffwdme.defaults.audioBaseUrl + 'male/voice',
                    "meta_data": { "INIT": { "start": 0.01, "length": 8.01 }, "C": { "start": 8.01, "length": 8.01 }, "TL_now": { "start": 16.01, "length": 8.01 }, "TL_100": {"start": 24.01,"length": 8.01},"TL_500": {"start": 32.01,"length": 8.01},"TL_1000": {"start": 40.01,"length": 8.01},"TSLL_now": {"start": 48.01,"length": 8.01 },"TSLL_100": {"start": 56.01,"length": 8.01},"TSLL_500": {    "start": 64.01,    "length": 8.01  },  "TSLL_1000": {    "start": 72.01,    "length": 8.01  },  "TSHL_now": {    "start": 80.01,    "length": 8.01  },  "TSHL_100": {    "start": 88.01,    "length": 8.01  },  "TSHL_500": {    "start": 96.01,    "length": 8.01  },  "TSHL_1000": {    "start": 104.01,    "length": 8.01  },  "TR_now": {    "start": 112.01,    "length": 8.01  },  "TR_100": {    "start": 120.01,    "length": 8.01  },  "TR_500": {    "start": 128.01,    "length": 8.01  },  "TR_1000": {    "start": 136.01,    "length": 8.01  },  "TSLR_now": {    "start": 144.01,    "length": 8.01  },  "TSLR_100": {    "start": 152.01,    "length": 8.01  },  "TSLR_500": {    "start": 160.01,    "length": 8.01  },  "TSLR_1000": {    "start": 168.01,    "length": 8.01  },  "TSHR_now": {    "start": 176.01,    "length": 8.01  },  "TSHR_100": {    "start": 184.01,    "length": 8.01  },  "TSHR_500": {    "start": 192.01,    "length": 8.01  },  "TSHR_1000": {    "start": 200.01,    "length": 8.01  },  "TU": {    "start": 208.01,    "length": 8.01  },  "C_100": {    "start": 216.01,    "length": 8.01  },  "C_500": {    "start": 224.01,    "length": 8.01  },  "C_1000": {    "start": 232.01,    "length": 8.01  },  "C_LONG":{    "start": 240.01,    "length": 8.01  },  "FINISH":{    "start": 248.01,    "length": 8.01  },  "EXIT1":{    "start": 256.01,    "length": 8.01  },  "EXIT2":{    "start": 264.01,    "length": 8.01  },  "EXIT3":{    "start": 272.01,    "length": 8.01  },  "EXIT4":{    "start": 280.01,    "length": 8.01  },  "EXIT5":{    "start": 288.01,    "length": 8.01  }}};

  window.widgets = {
    map       : map,
    autozoom  : new ffwdme.components.AutoZoom({ map: map }),
    reroute   : new ffwdme.components.AutoReroute({ parent: '#playground' }),

    speed     : new ffwdme.components.Speed({ parent: '#playground', grid: { x: 1, y: 12 } }),
    destTime  : new ffwdme.components.TimeToDestination({ parent: '#playground', grid: { x: 4, y: 12 } }),
    destDist  : new ffwdme.components.DistanceToDestination({ parent: '#playground', grid: { x: 7, y: 12 } }),
    arrival   : new ffwdme.components.ArrivalTime({ parent: '#playground', grid: { x: 10, y: 12 } }),
    nextTurn  : new ffwdme.components.NextStreet({ parent: '#playground', grid: { x: 4, y: 11 } }),
    distance  : new ffwdme.components.DistanceToNextTurn({ parent: '#playground', grid: { x: 4, y: 10 } }),
    arrow     : new ffwdme.components.Arrow({ parent: '#playground', grid: { x: 0, y: 10 } }),
    //audio     : new ffwdme.components.AudioInstructions({ parent: '#playground', grid: { x: 0, y: 6 }, bootstrapAudioData: audioData}),

    // experimental
    //  mapRotator: new ffwdme.components.MapRotator({ map: map }),
    // zoom      : new ffwdme.components.Zoom({ map: map, parent: '#playground', grid: { x: 3, y: 3 }}),
    // overview  : new ffwdme.components.RouteOverview({ map: map, parent: '#playground', grid: { x: 2, y: 2 }}),

    // debugging
    // geoloc  : new ffwdme.debug.components.Geolocation({ parent: '#playground', grid: { x: 5, y: 1 }}),
    //navInfo : new ffwdme.debug.components.NavInfo(),
    //routing : new ffwdme.debug.components.Routing()
  };

  if ((/debug=/).test(window.location.href)){
    $('#views-toggle').click(function(){
      $('#playground').toggleClass('hidden');
    });
    $('#views-toggle, #nav-info-trigger, #routing-trigger').removeClass('hidden');
  }
}

/**
 * HTML5 geo location API: http://www.tutorialspoint.com/html5/html5_geolocation.htm
 */

function MazdaGeoProvider() {
  this.lastPosition = null;

  var that = this;

  this.MazdaKompass = {};
  this.MazdaKompass.onGpsChanged = function (gpsData) {
    if (that.showLocationCallback) {
      that.showLocationCallback(gpsData); //todo maybe alter the data format to conform W3C Geolocation API specification
    }
  };

  this.watchPosition = function (showLocation, errorHandler, options) {
    that.showLocationCallback = showLocation;
    that.errorHandler = errorHandler;
    that.options = options;
  };

  this.clearWatch = function () {
    that.showLocationCallback = null;
    that.errorHandler = null;
    that.options = null;
  };

  this.getCurrentPosition = function () {
    return this.lastPosition;
  };
}

