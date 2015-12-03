/**
 * ffwdme.js - Turn by turn navigation in the browser.
 * @version v0.4.1
 * @copyright Copyright (c) 2011-2015 Christian Bäuerlein, Silvia Hundegger; 2012-2015 flinc GmbH
 * @license MIT
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @class The ffwdme base class which is heavily based on the Base.js lib of Dean Edwards.
 *
 * - Base.js, version 1.1a
 * - Copyright 2006-2009, Dean Edwards
 * - http://dean.edwards.name/weblog/2006/03/base/
 * - http://dean.edwards.name/weblog/2006/05/prototype-and-base/
 * - License: http://www.opensource.org/licenses/mit-license.php
 *
 */

var Class = function() {
  // dummy
};
/**
 * Extends a class by the given methods and properties.
 *
 * @memberOf ffwdme.Class
 *
 * @param {Object} _instance
 *   An object containing the instance properties and methods.
 * @param {Object} _static
 *   An object containing static properties and methods.
 *
 * @return {ffwdme.Class}
 *   The new defined class.
 */
Class.extend = function(_instance, _static) { // subclass
  var extend = Class.prototype.extend;

  // build the prototype
  Class._prototyping = true;
  var proto = new this;
  extend.call(proto, _instance);
  proto.base = function() {
    // call this method from any other method to invoke that method's ancestor
  };
  delete Class._prototyping;

  var constructor = proto.constructor;
  var klass = proto.constructor = function() {
    if (!Class._prototyping) {
      if (this._constructing || this.constructor == klass) { // instantiation
        this._constructing = true;
        constructor.apply(this, arguments);
        delete this._constructing;
      } else if (arguments[0] != null) { // casting
        return (arguments[0].extend || extend).call(arguments[0], proto);
      }
    }
  };

  // build the class interface
  klass.ancestor = this;
  klass.extend = this.extend;
  //klass.forEach = this.forEach;
  klass.implement = this.implement;
  klass.prototype = proto;
  klass.toString = this.toString;
  klass.valueOf = function(type) {
    return (type == 'object') ? klass : constructor.valueOf();
  };
  extend.call(klass, _static);
  // class initialisation
  if (typeof klass.init == 'function') klass.init();
  return klass;
};

Class.prototype = {
  extend: function(source, value) {
    if (arguments.length > 1) { // extending with a name/value pair
      var ancestor = this[source];
      if (ancestor && (typeof value == 'function') && // overriding a method?
        // the valueOf() comparison is to avoid circular references
        (!ancestor.valueOf || ancestor.valueOf() != value.valueOf()) &&
        /\bbase\b/.test(value)) {
        // get the underlying method
        var method = value.valueOf();
        // override
        value = function() {
          var previous = this.base || Class.prototype.base;
          this.base = ancestor;
          var returnValue = method.apply(this, arguments);
          this.base = previous;
          return returnValue;
        };
        // point to the underlying method
        value.valueOf = function(type) {
          return (type == 'object') ? value : method;
        };
        value.toString = Class.toString;
      }
      this[source] = value;
    } else if (source) { // extending with an object literal
      var extend = Class.prototype.extend;
      // if this object has a customised extend method then use it
      if (!Class._prototyping && typeof this != 'function') {
        extend = this.extend || extend;
      }
      var proto = {toSource: null};
      // do the 'toString' and other methods manually
      var hidden = ['constructor', 'toString', 'valueOf'];
      // if we are prototyping then include the constructor
      var i = Class._prototyping ? 0 : 1;
      while (key = hidden[i++]) {
        if (source[key] != proto[key]) {
          extend.call(this, key, source[key]);

        }
      }
      // copy each of the source object's properties to this object
      for (var key in source) {
        if (!proto[key]) extend.call(this, key, source[key]);
      }
    }
    return this;
  }
};

/**
 * This hashtable proves access to the basic ffwdme.Class methods
 * within ancestors of ffwdme.Class.
 *
 * It is NOT available within ffwdme.Class itself because it represents
 * it itself.
 *
 * @example
 * SomeClass = ffwdme.Class.extend({
 *   constructor: function() {
 *     //access the bind method of the base class
 *     this.aMethodInContext = this.base.bind(this.aMethod, this);
 *   },
 *   aProperty: 'hello world',
 *   aMethod: function() {
 *     alert(this.aProperty);
 *   }
 * });
 *
 * @name base
 * @memberOf ffwdme.Class
 * @property
 * @type ffwdme.Class
 */

// initialise
Class = Class.extend({
  constructor: function() {
    this.extend(arguments[0]);
  },

  /**
    * Provides a wrapper function for method binding.
    *
    * @memberOf ffwdme.Class
    *
    * @param {Function} funct
    *   The method to be applied to the context.
    * @param {Object} ctx
    *   The context to bind the function to.
    *
    * @return {Function}
    *   The method wrapped to be bound to the passed context.
    */
   bind: function(funct, ctx) {
     return function() {
       return funct.apply(ctx, arguments);
     };
   },

   /**
     * Overwrites all passed methods of an object with the
     * same method with scope on the object.
     * Heavily inspired by underscore.js.
     */
   bindAll: function(object) {
     var functs = Array.prototype.slice.call(arguments, 1);

     for(var i = 0, len = functs.length; i < len; i++) {
       var funcName = functs[i];
        object[funcName] = this.bind(object[funcName], object);
     }

     return object;
   }
},

  {
  /**
   * Points to the parent class from which the current class or object is derived.
   *
   * @memberOf ffwdme.Class#
   *
   * @type ffwdme.Class
   */
  ancestor: Object,

  /**
   * Extends the ffwdme Class with all the passed classes.
   * Use it for mixins or easier multiple inheritance.
   *
   * @memberOf ffwdme.Class#
   *
   * @param {ffwdme.Class} klass
   *   One or more classes to extend the current class with
   *
   * @return {ffwdme.Class}
   *   The extended class.
   *
   */
  implement: function() {
    for (var i = 0; i < arguments.length; i++) {
      if (typeof arguments[i] == 'function') {
        // if it's a function, call it
        arguments[i](this.prototype);
      } else {
        // add the interface using the extend method
        this.prototype.extend(arguments[i]);
      }
    }
    return this;
  },

  toString: function() {
    return String(this.valueOf());
  }
});

module.exports = Class;

},{}],2:[function(require,module,exports){
var Class = require('./class');

var Geolocation = Class.extend({
  /**
 * Creates a new geo location handler. When initiating a ffwdme application,
 * an geo location handler is automatically created and attached to the app.
 *
 * @class The geo location class is an abstraction layer for accessing the geo
 * location of the device using (i.e. HTML5 Geolocation API).
 *
 * You don't have to worry about initializing this class it is automatically attached
 * to you ffwdme app.
 *
 * To get the informations about the GPS position you should register your callback
 * functions to the corresponding events.
 *
 * @augments ffwdme.Class
 * @constructs
 *
 */
  constructor: function(geoProvider){
    this.geoProvider = geoProvider;
    this.bindAll(this, 'positionUpdate', 'positionError');
  },

  /**
   * True if watching the position, false otherwise.
   *
   * @type Boolean
   */
  watching: false,

  /**
   * The watching id returned by the geo location interface.
   *
   * @type Integer
   */
  watchId: null,

  /**
   * A hashtable containing options passed to the geo location interface.
   *
   * @type Object
   */
  options: null,

  /**
   * The geo location interface used by this class, e.g. HTML5 or Google Gears.
   *
   * @type Object
   */
  geoProvider: null,

  /**
   * The last positionh retrieved by the geoprovider.
   *
   */
  last: null,

  /**
   * Immediately tries to return the current geo position.
   *
   * @param {Function} successCallback
   *   Callback function that gets triggered if the geo position could be determined.
   * @param {Function} errorCallback
   *   Callback function that gets triggered if it's not possible to determine the geo position.
   * @param {Object} options
   *   Hashtable containing options for the geo location interface.
   */
  getCurrentPosition: function(successCallback, errorCallback, options){
    this.geoProvider.getCurrentPosition(successCallback, errorCallback, options);
  },

  /**
   * Starts watching the geo position of the device. When a change is recognized,
   * the callback functions get triggered.
   *
   * Note: It's easier to handle if you register yourself for the corresponding
   * events (see ffwdme.Event).
   *
   * @param {Object} options
   *   Hashtable containing options for the geo location interface.
   * @param {Function} successCallback
   *   Callback function that gets triggered if the geo position could be determined.
   * @param {Function} errorCallback
   *   Callback function that gets triggered if it's not possible to determine the geo position.
   */
  watchPosition: function(options, successCallback, errorCallback){
    if (successCallback) ffwdme.on('geoposition:update', successCallback);
    if (errorCallback) ffwdme.on('geoposition:error', errorCallback);

    // initialize watching only once
    if (this.watching) return;

    this.watchId = this.geoProvider.watchPosition(
      this.positionUpdate,
      this.positionError,
      options
    );

    this.options = options;
    this.watching = true;
    ffwdme.trigger('geoposition:init');
  },

  clearWatch: function(){
    this.geoProvider.clearWatch(this.watchId);
  },

  /**
   * Internal callback (the only one really registered to the geo location interface)
   * triggers the corresponding event on a geo position update.
   *
   * @param {Object} position
   *   The position object recieved by the geo location interface.
   */
  positionUpdate: function(position) {
    var data = {
      geoposition: position,
      point: new ffwdme.LatLng(position.coords.latitude, position.coords.longitude)
    };

    var first = false;
    if (!this.last) first = true;
    this.last = data;

    if (first) ffwdme.trigger('geoposition:ready', data);
    ffwdme.trigger('geoposition:update', data);
  },

  /**
   * Internal callback (the only one really registered to the geo location interface)
   * triggers the corresponding event when an error occurs while a position update.
   *
   * @param {Object} error
   *   The error object recieved by the geo location interface.
   */
  positionError: function(error) {
    ffwdme.trigger('geoposition:error', { error: error });
  }
});

module.exports = Geolocation;

},{"./class":1}],3:[function(require,module,exports){
(function (global){
var Class = require('./class');
var Geolocation = require('./geolocation');
var LatLng = require('./lat_lng');
var Navigation = require('./navigation');
var Route = require('./route');
var NavigationInfo = require('./navigation_info');
var RoutingBase = require('./routing/base');
var RoutingGraphHopper = require('./routing/graph_hopper');
var UtilsGeo = require('./utils/geo');
var UtilsProxy = require('./utils/proxy');

(function(global, undefined) {
  /**
    * @name ffwdme
    * @class The ffwdme base singleton
    */
  var ffwdme = {
    Class: Class,
    Geolocation: Geolocation,
    LatLng: LatLng,
    Navigation: Navigation,
    NavigationInfo: NavigationInfo,
    Route: Route,


    routing: {
      Base: RoutingBase,
      GraphHopper: RoutingGraphHopper
    },

    utils: {
      Geo: UtilsGeo,
      Proxy: UtilsProxy
    },


    /**
     * @augments ffwdme.Class
     * @constructs
     *
     * @param {Boolean} [options.ingoreGeolocation="false"]
     *   If true, the geo position of the device is not
     *   watched automatically.
     */
    initialize: function(options) {
      options = options || {};
      this.options = options;

      options.geoProvider || (options.geoProvider = window.navigator.geolocation);

      this.geolocation = new ffwdme.Geolocation(options.geoProvider);
      // start watching the geoposition
      if (!options.ingoreGeolocation) {
        this.geolocation.watchPosition({
          enableHighAccuracy: true,
          maximumAge: 30 * 1000,
          timeout: 30 * 1000
        });
      }

      if (options.routing && ffwdme.routing[options.routing]) {
        this.routingService = ffwdme.routing[options.routing];
      }

      this.navigation = new ffwdme.Navigation();
    },

    /**
     * The version of ffwdme.
     *
     * @type String
     */
    VERSION: '0.4.0',

    /**
     * Holds all callbacks for ffwdme events.
     */
    callbacks: null,

    defaults: {
      imageBaseUrl: 'components/',
      audioBaseUrl: 'components/audio_instructions/voices/'
    },

    options: {},

    /**
     * The Geolocation handler of the app that
     * is able to determine the geographic information.
     *
     * The framework will automatically choose the right
     * interface for accessing GPS informations, depending
     * on the device executing the application.
     *
     * @type ffwdme.Geolocation
     */
    geolocation: null,

    /**
     * The navigation handler used by the app.
     *
     * When a route was calculated it can be passed to
     * the navigation handler for later turn by turn
     * navigation.
     *
     * @type ffwdme.Navigation
     */
    navigation: null,

    routingService: null,

    reset: function() {
      this.callbacks = null;
      this.geolocation && this.geolocation.clearWatch();
      this.geolocation = null;
      this.routingService = null;
      this.navigation = null;
    },

    /**
     * Adds a callback for the passed event.
     *
     * @param {String} events
     *   The name of the event to register the listener to.
     * @param {Function} callback
     *   The callback to be registered.
     * @return {ffwdme}
     *   The ffwdme singleton
     */
    on: function(events, callback) {
      // create callback hashtable if it doesn't exist
      this.callbacks = this.callbacks || {};

      var list = events.split(' '), event;

      for (var i = 0, len = list.length; i < len; i++) {
        event = list[i];
        // create array for event type if it doesn't exist
        this.callbacks[event] || (this.callbacks[event] = []);
        this.callbacks[event].push(callback);
      }

      return this;
    },

    /**
     * Registers a callback for an event that only gets triggered
     * once and then detaches itself from the callback chain automatically.
     *
     * @param {String} event
     *   The name of the event to register the listener to once.
     * @param {Function} callback
     *   The callback to be registered once.
     * @return {ffwdme}
     *   The ffwdme singleton
     */
    once: function(event, callback) {
      var wrapper = function(data){
        callback(data);
        ffwdme.off(event, wrapper);
      };
      this.on(event, wrapper);
      return this;
    },

    /**
     * Removes a callback for the passed event.
     *
     * @param {String} events
     *   The event to remove the callback from.
     * @param {Function} callback
     *   The callback to be removed.
     * @return {ffwdme}
     *   The ffwdme singleton
     */
    off: function(event, callback) {
      if (!this.callbacks || !this.callbacks[event]) return this;

      var callbacks = this.callbacks[event];
      for (var i = 0, len = callbacks.length; i < len; i++) {
        if (callbacks[i] === callback) {
          this.callbacks[event].splice(i,1);
          return this;
        }
      }
      return this;
    },

    /**
     * Triggers all callbacks for the passed event type.
     * Mainly used internal by the system. Usually you DON'T have to use this method.
     *
     * @param {String} event
     *   The name of the event to be triggered.
     * @param {Object} data
     *   A hashtable containing relevant data related to the event.
     *
     * @return {ffwdme}
     *   Returns the ffwdme singleton event.
     */
    trigger: function(event, data) {
      this.callbacks = this.callbacks || {};
      // no event handler found
      if (!this.callbacks[event]) return this;
      var callbacks = this.callbacks[event];

      data || (data = {});
      data.type = event;

      // walk array backwards
      for (var len = callbacks.length, i = len-1; i >= 0; i--) {
        // call event handler
        callbacks[i](data);
      }
      return this;
    },

    /**
     * Overwrites toString to provide a better readable
     * information about the app.
     *
     * @private
     */
    toString: function() {
      return 'ffwdme.js v' + this.VERSION;
    }
  };

  // attach ffwdme to the global namespace
  global.ffwdme = ffwdme;

})(typeof window !== 'undefined' ? window : global);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./class":1,"./geolocation":2,"./lat_lng":4,"./navigation":5,"./navigation_info":6,"./route":7,"./routing/base":8,"./routing/graph_hopper":9,"./utils/geo":10,"./utils/proxy":11}],4:[function(require,module,exports){
// for performance reasons we don't use ffwdme.Class
 var LatLng = function(lat, lng) {

  if (toString.call(lat) === '[object Array]') {
    lng = lat[1];
    lat = lat[0];
  }

  lat = parseFloat(lat);
  lng = parseFloat(lng);

  lat = Math.max(Math.min(lat, 90), -90);
  lng = (lng + 180) % 360 + (lng < -180 ? 180 : -180);

  this.lat = lat;
  this.lng = lng;
};

LatLng.prototype = {
  toString: function() {
    return 'LatLng: ' + this.lat + ', ' + this.lng;
  }
};

module.exports = LatLng;

},{}],5:[function(require,module,exports){
var Class = require('./class');
var geoUtils = require('./utils/geo');

var Navigation = Class.extend({
  /**
     * Creates a new navigation handler.
     *
     * @class The route navigation will check if the
     * geoposition of the device is still on the
     * calculated route.
     *
     * @augments ffwdme.Class
     * @constructs
     */
  constructor: function(options) {
    this.bindAll(this, 'getPositionOnRoute', 'rerouteCallback');
  },

  /**
     * The route object to handle.
     *
     * @type Object
     */
  route: null,

  /**
     * Holds an Array of the positions that could be
     * mapped to the route.
     *
     * Basically these are HTML GeoPosition objects
     * enriched with a _positionOnRoute hashtable.
     *
     * @type Array
     */
  _lastPositionsOnRoute: [],

  _currentPositionOnRoute: null,

  _lastDirectionPathIndex: null,

  _lastDrivingDirectionIndex: null,

  startTime: null,

  startTimeByDirection: {},

  /**
     * In case the position of the device can't
     * be mapped on the route this counter holds the
     * number of times it happened in a row.
     *
     * Will be resetted once the position can be mapped
     * again on the route.
     *
     * @type Integer
     */
  offRouteCounter: 0,

  /**
     * In case the position of the device can't
     * be mapped on the route this timestamp saves
     * the first time this occured.
     *
     * Will be resetted once the position can be mapped
     * again on the route.
     *
     * @type Integer
     */
  offRouteStartTimestamp: 0,

  // debug only
  routePointCounter: 0,

  /**
     * Time in ms that the position could not be
     * mapped to the route.
     *
     * Will be resetted once the position can be mapped
     * again on the route.
     *
     * @type Integer
     */
  offRouteTime: 0,

  reset: function(){
    this._lastPositionsOnRoute = [];
    this._currentPositionOnRoute = null;
    this._lastDirectionPathIndex = null;
    this._lastDrivingDirectionIndex = null;
    this.offRouteCounter = 0;
    this.offRouteStartTimestamp = 0;
    this.routePointCounter = 0;
  },

  /**
     *
     *
     * @param {Object} route
     *   The calculated route to handle.
     *
     */
  setRoute: function(route) {
    this.reset();
    this.route = route;

    return this;
  },


  reroute: function(options) {
    options || (options = {});

    var directions = this.route.directions,
    lastDirection = directions[directions.length-1],
    destLat = lastDirection.path ? lastDirection.path[lastDirection.path.length - 1].lat : lastDirection.start.lat,
    destLng = lastDirection.path ? lastDirection.path[lastDirection.path.length - 1].lng : lastDirection.start.lng;

    ffwdme.on('reroutecalculation:success', this.rerouteCallback);

    options.dest = new ffwdme.LatLng(destLat, destLng);
    options.rerouting = true;

    var route = new ffwdme.routingService(options).fetch();

  },

  rerouteCallback: function(response) {
    ffwdme.off('reroutecalculation:success', this.rerouteCallback);
    this.setRoute(response.route);
  },


  /**
     * Starts the navigation.
     */
  start: function() {
    // repeat last position
    this.getPositionOnRoute(ffwdme.geolocation.last);

    ffwdme.on('geoposition:update', this.getPositionOnRoute);
    this.startTime = Date.now();
  },

  /**
     * Stops the navigation
     */
  stop: function() {
    ffwdme.off('geoposition:update', this.getPositionOnRoute);
  },

  notFoundOnRoute: function(result) {

    if (this.offRouteCounter === 0) {
      this.offRouteStartTimestamp = Date.now();
    } else {
      this.offRouteTime = Date.now() - this.offRouteStartTimestamp;
    }

    this.offRouteCounter++;

    ffwdme.trigger('navigation:offroute', { navInfo: result });
  },

  getPositionOnRoute: function(position) {

    var MAX_DISTANCE = 30;//Math.max(35, Math.min(pos.coords.accuracy.toFixed(1), 50));// OR 35?!

    var nearest;
    // try to find the current position on the route
    if (!this._lastDrivingDirectionIndex) {
      nearest = this.route.nearestTo(position.point, 0, 0);
    } else {

      var jumping = this.approachInSteps();

      var jumpLen = jumping.length, currJump;
      for (var i = 0; i < jumpLen; i++) {
        currJump = jumping[i];
        nearest = this.route.nearestTo(position.point, currJump.dIndex, currJump.pIndex, currJump.max);
        if (nearest.point && nearest.distance < MAX_DISTANCE) break;
      }
    }

    this.routePointCounter++;

    var navInfo = new ffwdme.NavigationInfo({
      nearest: nearest,
      raw: position,
      navigation: this,
      route: this.route,
      onRoute: !!(nearest.point && nearest.distance < MAX_DISTANCE)
    });

    if (!navInfo.onRoute) {
      return this.notFoundOnRoute(navInfo);
    }

    this.offRouteCounter = 0;

    return ffwdme.trigger('navigation:onroute', { navInfo: navInfo });
  },

  approachInSteps: function() {
    return [
      {
        dIndex: this._lastDrivingDirectionIndex,
        pIndex: this._lastDirectionPathIndex,
        max: 2
      },
      {
        dIndex: Math.max(this._lastDrivingDirectionIndex - 2 ,0),
        pIndex: 0,
        max: 5
      },
      {
        dIndex: Math.max(this._lastDrivingDirectionIndex - 4 ,0),
        pIndex: 0,
        max: 10
      },
      {
        dIndex: 0,
        pIndex: 0,
        max: false
      }
    ];
  }

}).implement(geoUtils);


module.exports = Navigation;

},{"./class":1,"./utils/geo":10}],6:[function(require,module,exports){
var Class = require('./class');

var NavigationInfo = Class.extend({
  /**
   * Creates a new navigation info object.
   *
   * @class The navigation info object is passed by the
   * navigation handler via the onRoute/offRoute events
   * and contains useful information for interactive
   * route guidance.
   *
   * It is passed to the event listeners of the
   * ffwdme.Event.NAVIGATION_ON_ROUTE and ffwdme.Event.NAVIGATION_OFF_ROUTE
   * events when a navigation was started.
   *
   * @augments ffwdme.Class
   * @constructs
   *
   */
  constructor: function(options) {
    this.position = options.nearest.point;
    this.positionRaw = options.raw.point;
    this.nearest = options.nearest;
    this.raw = options.raw;
    this.navigation = options.navigation;
    this.route = options.route;

    this.finalDirection = (this.nearest.directionIndex + 1 === this.route.directions.length);

    this.arrived = this.finalDirection && ffwdme.utils.Geo.distance(this.positionRaw, this.route.destination()) <= 35; // you arrived

    this.onRoute = options.onRoute;

    if (!this.onRoute) return;
    // Set directions
    this.currentDirection = this.route.directions[this.nearest.directionIndex];
    this.nextDirection = this.route.directions[this.nearest.directionIndex + 1];

    this.calculateDistances();
    this.calculateRatios();
    this.calculateTimes();
  },

  calculateRatios: function() {
    // The already completed distance of the direction
    var completedDistanceOfDirection = this.currentDirection.distance - this.distanceToNextDirection;
    var ratioCompletedDirection = completedDistanceOfDirection / this.currentDirection.distance;
    var round = Math.round;

    ratioCompletedDirection = round(ratioCompletedDirection * 100)/ 100;

    // TODO - This is a pretty dirty fix to prevent a negative ratio.
    if (ratioCompletedDirection < 0.01) ratioCompletedDirection = 0.01;

    this.ratioCompletedDirection = ratioCompletedDirection;

    var ratioCompletedRoute = (this.route.summary.distance - this.distanceToDestination) / this.route.summary.distance;
    ratioCompletedRoute = round(ratioCompletedRoute * 100)/ 100;

    // TODO - This is a pretty dirty fix to prevent a negative ratio.
    if (ratioCompletedRoute < 0.01) ratioCompletedRoute = 0.01;

    this.ratioCompletedRoute = ratioCompletedRoute;
  },

  calculateTimes: function() {
    // estimated time to the next direction in seconds...
    this.timeToNextDirection = Math.round( (1 - this.ratioCompletedRoute) * this.currentDirection.duration );
    this.timeToDestination = Math.round( (1 - this.ratioCompletedRoute) * this.route.summary.duration );
  },

  calculateDistances: function() {

    var geo = ffwdme.utils.Geo;
    // practical tests have proven we should
    // substract 10m from the distances to
    // because of the fuzzy gps position
    var manualDistanceOffset = 10;
    var directions = this.route.directions;

    // data
    var currentDirection =  this.route.directions[this.nearest.directionIndex];
    var nextPathPoint = currentDirection.path[this.nearest.nextPathIndex];

    // distance vars
    var distanceToNextPath = geo.distance(this.position, nextPathPoint);
    var distanceToNextDirection, distanceToDestination, i, len;

    distanceToNextDirection = distanceToNextPath;
    for (i = this.nearest.nextPathIndex, len = currentDirection.path.length - 1; i < len; i++) {
      if (!currentDirection.path[i+1]) break;
      distanceToNextDirection += geo.distance(currentDirection.path[i], currentDirection.path[i+1]);
    }
    if (distanceToNextDirection >= 10) distanceToNextDirection -= manualDistanceOffset;
    this.distanceToNextDirection = distanceToNextDirection;

    distanceToDestination = distanceToNextDirection;
    for (i = this.nearest.directionIndex + 1, len = directions.length; i < len; i++) {
      distanceToDestination += directions[i].distance;
    }
    this.distanceToDestination = distanceToDestination;
  },

  /**
   * @type {Object}
   */
  nearest: null,

  /**
   * @type {Object}
   */
  raw: null,

  /**
   * The raw GPS values derived by the device.
   *
   * @type {Position}
   */
  positionRaw: null,

  /**
   * The interpolated GPS values as the
   * navigation tried to map them to the current
   * route.
   *
   * @type {Position}
   */
  position: null,

  /**
   * The distance to the next direction in meters.
   *
   * @type {Int}
   */
  distanceToNextDirection: null,

  /**
   * The distance to the destination in meters.
   *
   * @type {Int}
   */
  distanceToDestination: null,

  /**
   * The time to the next direction in seconds.
   *
   * @type {Int}
   */
  timeToNextDirection: null,

  /**
   * The time to the destination in seconds.
   *
   * @type {Int}
   */
  timeToDestination: null,

  /**
   * The ratio of how much of the current direction has been
   * completed (from 0.00 to 1.00).
   *
   * @type {String}
   */
  ratioCompletedDirection: null,

  /**
   * The ratio of how much of the whole route has been
   * completed (from 0.00 to 1.00).
   *
   * @type {String}
   */
  ratioCompletedRoute: null,

  /**
   * The next direction/turn on the route.
   *
   * @type {ffwdme.RoutingServiceResponse.Direction}
   */
  nextDirection: null,

  /**
   * If true, this is the last direction and the driver is approaching the finishing line.
   *
   * @type {Boolean}
   */
  finalDirection: null,

  /**
   * If true, the driver arrived at his destination.
   * At the moment this is if the driver is on the last direction and the linear distance between
   * driver and destination is below 35 meters.
   *
   * @type {Boolean}
   */
  arrived: null

});

module.exports = NavigationInfo;

},{"./class":1}],7:[function(require,module,exports){
var Class = require('./class');
var geoUtils = require('./utils/geo');

var Route = Class.extend({
  /**
   * Creates a new route object.
   *
   * @class The route object represents a calculated route
   *  as it is returned by one of the routing services.
   *
   * @augments ffwdme.Class
   * @constructs
   *
   */
  constructor: function(){

  },

  summary: null,

  directions: null,

  parse: function(json) {
    this.summary = json.summary;
    this.directions = json.directions;

    for (var i = 0, len = this.directions.length; i < len; i++) {
      var path = this.directions[i].path, newPath = [];
      for (var j = 0, plen = path.length; j < plen; j++) {
        newPath.push(new ffwdme.LatLng(path[j][0], path[j][1]));
      }
      this.directions[i].path = newPath;
    }
    return this;
  },

  start: function() {
    var firstDirection = this.directions[0];
    var firstPosition  = firstDirection.path[0];
    return firstPosition;
  },

  destination: function() {
    var lastDirection = this.directions[this.directions.length - 1];
    var lastPosition  = lastDirection.path[lastDirection.path.length - 1];
    return lastPosition;
  },

  /**
   * Tries to map the current position on the route.
   *
   * @param {ffwdme.LatLng} pos
   *   A ffwdme LatLng object
   * @param {Object} direction_index
   *   The index of the directions of the route to start
   *   searching for the nearest point of the route.
   * @param {Object} path_index
   *   The index of the single paths representing the direction
   *   above the start searching.
   * @param {Object} direction_max
   *   The maximum number of directions to go through.
   *
   * @return {Object}
   *   A hashtable containing the following information:
   *   directionIndex (int): The direction index of the nearest point found.
   *   prevPathIndex (int): The path index of the nearest point found.
   *   nextPathIndex (int): The path index of the nearest point found.
   *   distance (float): The distance to from the nearest point found to the captured position.
   *   point: (ffwdme.LatLng):The nearest point found on the route (keys: lat, lng).
   */
  nearestTo: function(pos, directionIndex, pathIndex, maxIterations){

    var nearest = {
      distance: 999999,
      point:    null,
      directionIndex: null,
      prevPathIndex: null,
      nextPathIndex: null
    };

    var geo = geoUtils;
    var len = maxIterations ? Math.min(maxIterations, this.directions.length) : this.directions.length;

    for (var i = directionIndex; i < len; i++) {
      var direction = this.directions[i];
      var pathLen = direction.path.length - 1;
      var pathStart = (i === directionIndex) ? pathIndex : 0;

      for (var j = pathStart; j < pathLen; j++) {
        var point = geo.closestOnLine(
          direction.path[j],
          direction.path[j + 1],
          pos
        );

        var distance = geo.distance(pos, point);

        // not closer than before
        if (nearest.distance < distance) continue;

        nearest.distance = distance;
        nearest.point    = point;
        nearest.directionIndex = i;
        nearest.prevPathIndex = j;
        nearest.nextPathIndex = j + 1;
      }
    }
    return nearest;
  }
}, {

  // This function is from Google's polyline utility.
  decodePolyline: function(polylineStr) {
    var len = polylineStr.length;
    var index = 0;
    var array = [];
    var lat = 0;
    var lng = 0;

    while (index < len) {
      var b;
      var shift = 0;
      var result = 0;
      do {
        b = polylineStr.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = polylineStr.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      array.push([lat * 1e-5, lng * 1e-5]);
    }

    return array;
  }
});

module.exports = Route;

},{"./class":1,"./utils/geo":10}],8:[function(require,module,exports){
var Class = require('../class');

var Base = Class.extend({
  /**
   * desc
   *
   * @class The class represents a base client for a routing service.
   *   You can't use this class directly but must use a child class,
   *   which has implemented the abstract method: fetch.
   *
   * @augments ffwdme.Class
   * @constructs
   *
   *
   */
  constructor: function(options) {
    this.options = options;

    var attrs = ['start', 'dest', 'rerouting'], attr;
    for(var i = 0, len = attrs.length; i < len; i++) {
      attr = attrs[i];
      this[attr] = options && options[attr];
    }

    if (!this.start) this.start = ffwdme.geolocation.last.point;
    return this;
  },

  options: null,

  /**
   * The last successful route response.
   *
   * @type ffwdme.Route
   */
  lastRoute: null,

  // must trigger start event, as a result is must call either success or error
  fetch: function() {
    throw 'ffwdme.routing.Base is an abstract class. You must use a child class.';
  },

  eventPrefix: function() {
    return this.rerouting ? 'reroutecalculation' : 'routecalculation';
  },

  success: function(response, route) {
    this.lastRoute = route;
    ffwdme.trigger(this.eventPrefix() + ':success', {
      routing: this,
      route: route,
      response: response
    });
  },

  error: function(error) {
    ffwdme.trigger(this.eventPrefix() + ':error', {
      routing: this,
      error: error
    });
  }
});

module.exports = Base;

},{"../class":1}],9:[function(require,module,exports){
var Base = require('./base');

var GraphHopper = Base.extend({
  /**
   * Creates a new instance of the GraphHopper routing service class.
   * When doing so, this object adds itself as the a global handler for route
   * responses.
   *
   * Options:
   * - apiKey
   *
   * @class The class represents a client for the ffwdme routing service
   * using GraphHopper.
   *
   * @augments ffwdme.Class
   * @constructs
   *
   */
  constructor: function(options) {
    this.base(options);
    this.bindAll(this, 'parse', 'error');

    this.apiKey = ffwdme.options.graphHopper.apiKey;

    if (options.anchorPoint) {
      this.anchorPoint = options.anchorPoint;
      this.direction = this.start;
      this.start = this.anchorPoint;
    }
  },

  /**
   * The base url for the service.
   *
   * @type String
   */
  BASE_URL: 'http://graphhopper.com/api/1/',

  // set via constructor
  apiKey: null,

  modifier: 'fastest',

  routeType: 'car',

  lang: 'en_EN',

  route: null,

  anchorPoint: null,

  direction: null,

  fetch: function() {

    var via = '';

    if (this.direction) {
      via += '&point=' + [this.direction.lat, this.direction.lng].join('%2C');
    }

    var reqUrl = [
      this.BASE_URL,
      'route?type=jsonp',
      '&key=',
      this.apiKey,
      '&locale=',
      this.lang,
      '&vehicle=',
      this.routeType,
      '&weighting=',
      this.modifier,
      '&point=',
      [
        this.start.lat,
        this.start.lng,
      ].join('%2C'),
      via,
      '&point=',
      [
        this.dest.lat,
        this.dest.lng
      ].join('%2C')
    ];

    ffwdme.trigger(this.eventPrefix() + ':start', { routing: this });

    ffwdme.utils.Proxy.get({
      url: reqUrl.join(''),
      success: this.parse,
      error: this.error
    });

    return ffwdme;
  },

  error: function(error) {
    this.base(error);
  },

  parse: function(response) {

    // check for error codes
    // https://github.com/graphhopper/graphhopper/blob/master/docs/web/api-doc.md
    if (response.info.errors) return this.error(response);

    var route = response.paths[0];

    var routeStruct = { directions: [] };
    routeStruct.summary = {
      distance: parseInt(route.distance, 10),
      duration: route.time / 1000
    };

    var path = ffwdme.Route.decodePolyline(route.points);

    var instruction, d, extractedStreet, geomArr;
    var instructions = route.instructions;

    // we remove the last instruction as it only says "Finish!" in
    // GraphHopper and has no value for us.
    instructions.pop();

    for (var i = 0, len = instructions.length; i < len; i++) {
      instruction = instructions[i];
      d = {
        instruction:  instruction.text,
        distance:     parseInt(instruction.distance, 10),
        duration:     instruction.time / 1000,
        turnAngle:    this.extractTurnAngle(instruction.sign),
        turnType:     this.extractTurnType(instruction.sign)
      };

      d.path = path.slice(instruction.interval[0], instruction.interval[1] + 1);

      // Strip the streetname out of the route description
      extractedStreet = d.instruction.split(/(?:on |near |onto |at |Head )/).pop();
      d.street = extractedStreet.length == d.instruction.length ? '' : extractedStreet;

      routeStruct.directions.push(d);
    }

    this.route = new ffwdme.Route().parse(routeStruct);

    this.success(response, this.route);
  },

  // "FINISH"
  // "EXIT1"
  // "EXIT2"
  // "EXIT3"
  // "EXIT4"
  // "EXIT5"
  // "EXIT6"
  // "TU"
  extractTurnType: function(indication) {
    var name;
    switch (indication) {
    case 0: //continue (go straight)
      name = 'C';
      break;
    case -2: // turn left
       name = 'TL';
       break;
    case -1: // turn slight left
      name = 'TSLL';
      break;
    case -3: // turn sharp left
      name = 'TSHL';
      break;
    case 2: // turn right
      name = 'TR';
      break;
    case 1: // turn slight right
      name = 'TSLR';
      break;
    case 3: // turn sharp right
      name = 'TSHR';
      break;
    // case 'TU': // U-turn
    //   name = 180;
    //   break;
    }
    return name;
  },

  // see https://github.com/graphhopper/graphhopper/blob/master/docs/web/api-doc.md
  extractTurnAngle: function(indication) {
    var angle;
    switch (indication) {
    case 0: //continue (go straight)
      angle = 0;
      break;
    case -2: // turn left
       angle = 90;
       break;
    case -1: // turn slight left
      angle = 45;
      break;
    case -3: // turn sharp left
      angle = 135;
      break;
    case 2: // turn right
      angle = -90;
      break;
    case 1: // turn slight right
      angle = -45;
      break;
    case 3: // turn sharp right
      angle = -135;
      break;
    // case 'TU': // U-turn
    //   angle = 180;
    //   break;
    }
    return angle;
  }
});

module.exports = GraphHopper;

},{"./base":8}],10:[function(require,module,exports){
module.exports =
/**
  * This is a container for helper functions that can be mixed into other objects
  */
{
  EARTH_RADIUS: 6378137,

  DEG_TO_RAD_FACTOR: Math.PI / 180,

  /**
   * Returns the distance between two LatLng objects in meters.
   *
   * Slightly modified version of the harversine formula used in Leaflet:
   *  https://github.com/Leaflet/Leaflet
   */
  distance: function (p1, p2) {
    // convert degrees to radians
    var lat1 = p1.lat * this.DEG_TO_RAD_FACTOR;
    var lat2 = p2.lat * this.DEG_TO_RAD_FACTOR;
    var a = Math.sin(lat1) * Math.sin(lat2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.cos((p2.lng - p1.lng) * this.DEG_TO_RAD_FACTOR);

    return parseInt(this.EARTH_RADIUS * Math.acos(Math.min(a, 1)));
  },

  /**
   * Returns the closest point on a line
   * to another given point.
   *
   */
  closestOnLine: function(s1, s2, p){
    var x1 = s1.lat, y1 = s1.lng, x2 = s2.lat, y2 = s2.lng, px = p.lat, py = p.lng;
    var xDelta = x2 - x1;
    var yDelta = y2 - y1;

    //p1 and p2 cannot be the same point
    if ((xDelta === 0) && (yDelta === 0)) {
      return s1;
    }

    var u = ((px - x1) * xDelta + (py - y1) * yDelta) / (xDelta * xDelta + yDelta * yDelta);

    var closestPoint;
    if (u < 0) {
      closestPoint = [x1, y1];
    } else if (u > 1) {
      closestPoint = [x2, y2];
    } else {
      closestPoint = [x1 + u * xDelta, y1 + u * yDelta];
    }

    return (new ffwdme.LatLng(closestPoint[0], closestPoint[1]));
  }

};

},{}],11:[function(require,module,exports){
/**
 * @class
 * This singleton provides a script tag proxy for asynchronous cross domain
 * requests using JSONP.
 *
 */
var Proxy = {

  /**
   *
   * A hashtable that holds references to all generated script tags.
   * The key is the generated id for the tag.
   *
   * @property
   * @type Object
   */
  _tags: {},

  callbacks: {},

  errorCallbacks: {},

  successfullCallbacks: {},

  devNull: function(){},

  /**
   * Counter for the generated ids of the script tags.
   *
   * @type Integer
   */
  _idCounter: 0,

  /**
   * The prefix that is used to generate the ids of
   * the script tags.
   *
   * @type String
   */
  _idPrefix: 'ffwdme-Proxy-',

  _callbackPrefix: 'ffwdme.utils.Proxy.callbacks.',

  _headTag: document.getElementsByTagName('head')[0],

  checkForTimeout: function(callbackId) {
    if (this.successfullCallbacks[callbackId] === true) return;
    this.errorCallbacks[callbackId]();
  },

  removeTimeoutCheck: function(callbackId) {
    this.callbacks[callbackId] = this.devNull;
    delete(this.errorCallbacks[callbackId]);
  },

  get: function(options) {

    options = options || {};

    var callback   = options.callback || 'callback',
        tagId = this._idPrefix + this._idCounter++,
        callbackId = 'cb' + this._idCounter,
        self = this;

    var url = [
      options.url,
      options.url.indexOf('?') > -1 ? '&' : '?',
      callback,
      '=',
      this._callbackPrefix, callbackId
    ].join('');

    var scriptTag = this.buildScriptTag(url, tagId);

    var onSuccess = options.success;

    this.callbacks[callbackId]  = function(response) {
      self.successfullCallbacks[callbackId] = true;
      self.removeTimeoutCheck(callbackId);
      if (onSuccess){
        onSuccess(response);
      }
    };

    var onError = options.error;

    this.errorCallbacks[callbackId]  = function() {
      self.removeTimeoutCheck(callbackId);
      if (onError){
        onError({ error: 'timeout' });
      }
    };

    this._tags[tagId]       = scriptTag;
    this._headTag.appendChild(scriptTag);

    window.setTimeout(ffwdme.Class.prototype.bind.call(this, this.checkForTimeout, this), options.timeout || 10000, callbackId);
  },


  /**
   * Creates a new script tag and adds it to the header of
   * the DOM of the current page.
   *
   * @param {String} url
   *   The url to use for the 'src' attribute of the script tag.
   *
   * @returns {String} The id of the generated tag.
   */
  buildScriptTag: function(url, id) {
    var scriptTag = document.createElement('script');
    scriptTag.setAttribute('type', 'text/javascript');
    scriptTag.setAttribute('charset', 'utf-8');
    scriptTag.setAttribute('src', url);
    scriptTag.setAttribute('id', id);

    return scriptTag;
  },

  /**
   * Removes the script tag with the passed id, if exists.
   *
   * @param {String} tagId
   *   The id of the tag to be removed.
   */
  removeScriptTag: function(tagId) {
    if (this._tags[tagId]) {
      this._headTag.removeChild(this._tags[tagId]);
      delete this._tags[tagId];
    }
  }

};

module.exports = Proxy;

},{}]},{},[3]);
