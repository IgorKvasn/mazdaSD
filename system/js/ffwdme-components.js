/**
 * ffwdme.js - Turn by turn navigation in the browser.
 * @version v0.4.1
 * @copyright Copyright (c) 2011-2015 Christian Bäuerlein, Silvia Hundegger; 2012-2015 flinc GmbH
 * @license MIT
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var BaseIcon = require('../base_icon');

var ArrivalTime = BaseIcon.extend({

  icon: 'arrival_time/clock.svg',

  defaultUnit: 'Uhr',

  format: function(date) {
    var min = date.getMinutes();
    return [ date.getHours(), min > 10 ? min : ("0" + min) ].join(':');
  },

  navigationOnRoute: function(e) {
    var timeLeft = e.navInfo.timeToDestination;
    if (!timeLeft) return;

    var now = (new Date()).valueOf(),
        then = new Date(now + timeLeft * 1000);

     this.label(this.format(then));
  }
});

module.exports = ArrivalTime;

},{"../base_icon":8}],2:[function(require,module,exports){
var Base = require('../base');

var Arrow = Base.extend({

  constructor: function(options){
    this.base(options);

    this.turnTypeIconPaths = {
      'C':      'arrow/straight.svg',
      'TL':     'arrow/left.svg',
      'TSLL':   'arrow/half-left.svg',
      'TSHL':   'arrow/hard-left.svg',
      'TR':     'arrow/right.svg',
      'TSLR':   'arrow/half-right.svg',
      'TSHR':   'arrow/hard-right.svg',
      'EXIT1':  'arrow/roundabout.svg',
      'EXIT2':  'arrow/roundabout.svg',
      'EXIT3':  'arrow/roundabout.svg',
      'EXIT4':  'arrow/roundabout.svg',
      'EXIT5':  'arrow/roundabout.svg',
      'EXIT6':  'arrow/roundabout.svg',
      'TU':     'arrow/u-turn.svg',
      'FINISH': 'arrow/flag.svg'
    }; //turn types to icon files

    this.bindAll(this, 'onRoute');
    ffwdme.on('navigation:onroute', this.onRoute);

    this.render();
  },

  classes: 'ffwdme-components-container ffwdme-grid-w3 ffwdme-grid-h2',

  turnTypeIconPaths: null,

  arrowEl: null,

  labelEl: null,

  lastTurn: null,

  imgUrl: function(){
    return ffwdme.defaults.imageBaseUrl;
  },

  make: function() {
    this.base();

    //create arrow ele
    var img = document.createElement('img');
    img.src = this.getRetinaImageUrl(this.imgUrl() + this.turnTypeIconPaths.C); //straight as default
    this.arrowEl = $(img).addClass('ffwdme-components-small-arrow').appendTo($(this.el));

    //label for exit
    var label = document.createElement('span');
    this.labelEl = $(label).addClass('ffwdme-components-label').addClass('ffwdme-components-label-roundabout').appendTo($(this.el));
  },

  onRoute: function(e) {
    var turnType = null;

    if (e.navInfo.finalDirection === true){
      turnType = 'FINISH';
    } else {
      var direction = e.navInfo.nextDirection;
      if (!direction) return;

      turnType = direction.turnType;
      if (!turnType) return;


      if (/^EXIT/.test(turnType)){
        this.labelEl.html(turnType.split('EXIT')[1]);
      } else {
        this.labelEl.html('');
      }
    }

    this.updateIcon(turnType);
  },

  updateIcon: function(turnType){
    if (turnType != this.lastTurn){ // set img src only when turn type changes
      this.arrowEl[0].src = this.getRetinaImageUrl(this.imgUrl() + this.turnTypeIconPaths[turnType]);
      this.lastTurn = turnType;
    }
  }

});

module.exports = Arrow;

},{"../base":7}],3:[function(require,module,exports){
var Base = require('../base');
var SpritesPlayer = require('./sprites_player');

var AudioInstructions = Base.extend({

  constructor: function(options) {
    this.base(options);
    this.bindAll(this, 'navigationOnRoute', 'onGeopositionUpdate', 'toggleSound');

    //init audio player
    this.player = new SpritesPlayer();

    this.bootstrapAudioData = options.bootstrapAudioData; //sprite file and meta data

    ffwdme.on('navigation:onroute', this.navigationOnRoute);
    ffwdme.on('geoposition:update', this.onGeopositionUpdate);

    this.render();
  },

  lastAction: '',

  player: null,

  bootstrapAudioData: null,

  iconSoundOff: 'audio_instructions/sound-off.svg',

  icon: 'audio_instructions/sound-off.svg',

  iconSoundOn: 'audio_instructions/sound-on.svg',

  classes: 'ffwdme-components-container ffwdme-grid-w2 ffwdme-grid-h1',

  logoEl: null,

  forwardMeters: 50,

  navigationOnRoute: function(e) {

    var destinationDistance = e.navInfo.distanceToDestination;
    var distance = e.navInfo.distanceToNextDirection;
    var nextDirection = e.navInfo.nextDirection;

    if (destinationDistance && destinationDistance < this.forwardMeters && action != this.lastAction){
      this.player.play('FINISH');
      this.lastAction = action;
      return;
    }

    if (!distance || !nextDirection) return;

    var action = this.audioAction(distance, nextDirection.turnType);
    if (action.length && action != this.lastAction){
      this.player.play(action);
      this.lastAction = action;
    }

  },

  onGeopositionUpdate: function(e) {
    var speed = e.geoposition.coords.speed;
    this.forwardMeters = this.forwardMetersBySpeed(speed);
  },

  // meters per second
  forwardMetersBySpeed: function(speed) {
    //something wrong
    if (speed === 0) return 40;

    var fm = 20;

    if (speed < 11) {
      fm = speed * 4;
    } else if (speed < 22) {
      fm = speed * 5;
    } else {
      fm = speed * 6;
    }

    if (fm < 25) return 25;

    return fm;
  },

  audioAction: function(distance, turnType) {

    var _distance = '';
    var acceptedBackwardsMeters = this.forwardMeters / 4;

    if (turnType == 'TU'){
      return turnType;
    }

    if (/^EXIT/.test(turnType) && distance > 500){
      return '';
    }

    if (/^EXIT/.test(turnType)){
      return turnType;
    }

    if (distance > (1200-acceptedBackwardsMeters) &&
        distance < (10000+this.forwardMeters)){
      return 'C';
    } else if (distance > 10000){
      return 'C_LONG';
    }

    //distance
    if (distance > (1000-acceptedBackwardsMeters) && distance < (1000+this.forwardMeters)) {
      _distance = '_1000';
    } else if ( distance > (500-acceptedBackwardsMeters) && distance < (500+this.forwardMeters)) {
      _distance = '_500';
    } else if (distance > (100-acceptedBackwardsMeters) && distance < (100+this.forwardMeters)) {
      _distance = '_100';
    } else if (distance > 0 && distance < (10 + this.forwardMeters) && turnType != 'C') {
      _distance = '_now';
    }
    if (_distance.length){
      return turnType + _distance;
    } else {
      return '';
    }
  },


  imgUrl: function(){
    return this.getRetinaImageUrl(ffwdme.defaults.imageBaseUrl + this.icon);
  },

  iconEl: null,

  setIcon: function() {
    if (!this.iconEl) {
      var img = document.createElement('img');
      this.iconEl = $(img).addClass('ffwdme-components-audio-instructions').appendTo($(this.el));
    }

    this.iconEl[0].src = this.imgUrl();
  },

  toggleSound: function(e){

    if (!this.bootstrapAudioData){
      return;
    }

    if (this.player.toggleEnabled()){
      this.icon = this.iconSoundOn;

      this.player.setSprite(this.bootstrapAudioData.file, this.bootstrapAudioData.meta_data);
      this.player.play('INIT');
    } else {
      this.icon = this.iconSoundOff;
    }

    if (!this.player.canPlayAudio){
      this.icon = this.iconSoundOff;
      console.info('Browser does not support audio instructions');
      ffwdme.trigger('audio:error', { player: this.player });
    }


    this.setIcon();

  },

  make: function(){
    this.base();
    var self = this;
    $(this.el).click(function(e) { e.stopPropagation(); self.toggleSound(); });

    this.setIcon();
    return this;
  }
});

module.exports = AudioInstructions;

},{"../base":7,"./sprites_player":4}],4:[function(require,module,exports){
/**
  * SpritesPlayer
  * Author: Simon Franzen
  */

/**
  * Constructor
  *
  * Initialize audio player and bind to canplaythrough and
  * timeupdate from audio player
  */

var SpritesPlayer = function(options) {

  this.options = options || {};

  this.audioEl = document.createElement('audio');

  this.srcLoaded = false;

  //check if browser can play audio file
  this.canPlayAudio = this.fileType() !== '';


  this.enabled = false;

  this.audioEl.addEventListener('canplaythrough', this.srcReady.bind(this), false);

  this.audioEl.addEventListener('timeupdate', this.checkProgress.bind(this), false);

};

SpritesPlayer.prototype.options = null;

SpritesPlayer.prototype.audioEl = null;

SpritesPlayer.prototype.loggerEl = null;

SpritesPlayer.prototype.sprite = null;

SpritesPlayer.prototype.spriteMetaData = null;

SpritesPlayer.prototype.currentSprite = null;

SpritesPlayer.prototype.srcLoaded = null;

SpritesPlayer.prototype.canPlayAudio = null;

/**
  * Source ready
  *
  * Called when audio player fires canplaythrough event
  */
SpritesPlayer.prototype.srcReady = function() {

  if (!this.srcLoaded){
    this.srcLoaded = true;
    if (this.playWhenReady){
      this.audioEl.currentTime = this.currentSprite.start;
      this.audioEl.play();
    }
  }

};

/**
  * Check progress
  *
  * Called when audio player fires timeupdate event
  * (when audio player is playing)
  */
SpritesPlayer.prototype.checkProgress = function() {

  if (!this.currentSprite){
    return;
  }

  var maxTime = this.currentSprite.start + this.currentSprite.length;

  if (this.audioEl.currentTime >= maxTime) {
    this.audioEl.pause();
  }

};

/**
  * Play
  *
  * Plays a new part in audio sprite.
  */
SpritesPlayer.prototype.play = function(s) {

  if (!this.enabled) return false;

  if (!this.canPlayAudio) return false;

  if (!this.spriteMetaData) return false;

  this.currentSprite = this.spriteMetaData[s];

  if (!this.currentSprite) return false;

  //set source if not set
  if (!this.audioEl.src.length){
    var src = this.sprite + this.fileType();
    this.audioEl.src = src;
    this.audioEl.load();
    this.playWhenReady = true;
    return true;
  }

  //all fine, play sprite
  if (this.srcLoaded){
    this.audioEl.pause();
    this.audioEl.currentTime = this.currentSprite.start;
    this.audioEl.play();
  }

  return true;

};

/**
  * File Type
  *
  * Determines file type which browser can play.
  */
SpritesPlayer.prototype.fileType = function() {
  // this.log('determine file type');

  if (this.audioEl.canPlayType('audio/mp3')) {
    return '.mp3';
  } else if (this.audioEl.canPlayType('audio/m4a')) {
    return '.m4a';
  } else if (this.audioEl.canPlayType('audio/ogg')) {
    return '.ogg';
  } else if (this.audioEl.canPlayType('audio/wav')){
    return '.wav';
  }else {
    return '';
  }

};

SpritesPlayer.prototype.toggleEnabled = function(){
  if (this.fileType() !== ''){
    this.enabled = !this.enabled;
    if (!this.enabled){
      this.audioEl.pause();
    }
  }
  return this.enabled;

};

/**
  * Set sprite
  *
  * Sets the audio sprite for the player
  */
SpritesPlayer.prototype.setSprite = function(sprite, spriteMetaData) {
  this.sprite = sprite;
  this.spriteMetaData = spriteMetaData;
};

/**
  * Dev Log

SpritesPlayer.prototype.log = function(text) {
  this.loggerEl || (this.loggerEl = document.getElementById('log'));
  this.loggerEl.innerHTML += text + '<br/>';
  return this;
};*/

module.exports = SpritesPlayer;

},{}],5:[function(require,module,exports){
var Base = require('../base');

var AutoReroute = Base.extend({

  constructor: function(options) {
    this.base(options);
    this.lastPositions = [];

    this.bindAll(this, 'onRoute', 'offRoute', 'start', 'success', 'error', 'cachePositions');

    ffwdme.on('reroutecalculation:start', this.start);
    ffwdme.on('reroutecalculation:success', this.success);
    ffwdme.on('reroutecalculation:error', this.error);
    ffwdme.on('navigation:onroute', this.onRoute);
    ffwdme.on('navigation:offroute', this.offRoute);
    ffwdme.on('geoposition:update', this.cachePositions);

    this.render();
  },

  classes: 'ffwdme-components-container ffwdme-components-statusbar',

  offRouteCounter: 0,

  lastPositions: null,

  isRerouting: false,

  hideTimeout: null,

  status: {
    off: {
      message: 'You\'re off the route',
      css: 'red'
    },
    start: {
      message: 'Recalculating route...',
      css: 'yellow'
    },
    success: {
      message: 'Recalculation finished',
      css: 'green'
    }
  },

  cachePositions: function(e) {
    this.lastPositions = this.lastPositions.splice(-5);
    this.lastPositions.push(e.point);
  },

  show: function(){
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    $(this.el).show();
  },

  hide: function(delay) {
    var el = $(this.el);
    this.hideTimeout = setTimeout(function(){
      el.removeClass('green').removeClass('yellow').removeClass('red').hide();
    }, 3000);
  },

  onRoute: function() {
    $(this.el).hide();
  },

  offRoute: function() {
    this.offRouteCounter++;
    var state = this.status.off;
    $(this.el).addClass(state.css).text(state.message).show();
    if (this.offRouteCounter <= 15 || this.isRerouting) return;

    if (this.lastPositions.length) {
      ffwdme.navigation.reroute({
        anchorPoint: this.lastPositions[0]
      });
      this.lastPositions = [];
    } else {
      ffwdme.navigation.reroute();
    }
  },

  start: function() {
    this.isRerouting = true;
    var state = this.status.start;
    $(this.el).addClass(state.css).text(state.message).show();
  },

  success: function() {
    this.isRerouting = false;
    this.offRouteCounter = 0;
    var state = this.status.success;
    $(this.el).addClass(state.css).text(state.message).show().hide();
  },

  error: function() {
  }
});

module.exports = AutoReroute;

},{"../base":7}],6:[function(require,module,exports){
var Base = require('../base');

var AutoZoom = Base.extend({

  constructor: function(options) {
    this.base(options);
    this.bindAll(this, 'onGeopositionUpdate');

    ffwdme.on('geoposition:update', this.onGeopositionUpdate);
  },

  attrAccessible: ['map'],

  cachedZoomLevel: null,

  cachedZoomCount: 0,

  // meters per second
  zoomLevelBySpeed: function(speed) {
    // up to 40 km/h
    if (speed < 11) {
      return 17;
    } else if (speed < 22) {
      return 15;
    } else {
      return 13;
    }
  },

  onGeopositionUpdate: function(e) {

    if (!this.map.canControlMap(this)) return;

    var speed = e.geoposition.coords.speed;
    var zoom = this.zoomLevelBySpeed(speed);

    if (this.cachedZoomLevel != zoom) {
      this.cachedZoomLevel = zoom;
      this.cachedZoomCount = 0;
      return;
    }

    if (this.cachedZoomCount < 2) return this.cachedZoomCount++;

    this.map.setZoom(zoom);
  }
});

module.exports = AutoZoom;

},{"../base":7}],7:[function(require,module,exports){
var Base = ffwdme.Class.extend({

  constructor: function(options) {
    this.options = options || {};
    this.setAccessibleAttributes();

    if (this.onResize) {
      this.bindAll(this, 'onResize');
      $(window).bind('resize', this.onResize);
    }

    if (this.onOrientationChange) {
      this.bindAll(this, 'onOrientationChange');
      $(window).bind('orientationchange', this.onOrientationChange);
    }

    if (!ffwdme.components.Base.testElement) {
      this.createTestElement();
      $(window).bind('orientationchange', ffwdme.components.Base.updateOrientationClass);
      // TODO: create a trigger for this
      window.setTimeout(ffwdme.components.Base.updateOrientationClass, 200);
    }
  },

  classes: null,

  grid: null,

  $: function(selector) {
    return $(selector, this.el);
  },

  attrAccessible: ['el', 'grid'],

  setAccessibleAttributes: function() {
    var attributes = this.attrAccessible;
    for (var i = -1, l = attributes.length, attr; attr = attributes[++i],i < l;) {
      if (typeof this.options[attr] !== 'undefined') this[attr] = this.options[attr];
    }
  },

  make: function(){
    this.el = document.createElement('div');
    if (this.options.css) $(this.el).css(this.options.css);

    $(this.el).addClass(this.classes);
    this.setPosition();
    return this;
  },

  setPosition: function() {
    var grid = this.grid;
    if (!grid) return;
    var el = $(this.el);

    grid.x && el.addClass('ffwdme-grid-x' + grid.x);
    grid.y && el.addClass('ffwdme-grid-y' + grid.y);
  },

  createTestElement: function() {
    ffwdme.components.Base.testElement = $(document.createElement('div'))
      .addClass('ffwdme-components-test-size ffwdme-components-container ffwdme-grid-h1')
      .appendTo($('.ffwdme-components-wrapper'));

    var lastHeight = null;
    var updateHeights = function(){
      var el = ffwdme.components.Base.testElement;
      var testHeight = parseInt(el.height(), 10);
      if (lastHeight != testHeight) {
        $('.ffwdme-components-container').not(el).css({ fontSize: testHeight+ "px", lineHeight: testHeight + "px" })
      }
      lastHeight = testHeight;
    };

    $(window).bind('resize', updateHeights);
    // TODO: create a trigger for this
    window.setTimeout(updateHeights, 200);
  },

  render: function(){
    if (!this.el) this.make();
    $(this.options.parent).append(this.el);
    return this;
  },

  getRetinaImageUrl: function(imgPath){
    if (!!document.createElementNS &&
      !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect){
      return imgPath;
    } else {
      return imgPath.replace("svg", "png");
    }
  }
}, {
  testElement: null,

  updateOrientationClass: function() {
    var orientation = ffwdme.components.Base.determineOrientationClass();
    $('.ffwdme-components-container').removeClass('landscape portrait').addClass(orientation);
  },

  determineOrientationClass: function() {
    var orientation;

    if (typeof window.orientation === 'undefined') {
      orientation = 'portrait';
    } else if (window.orientation === 0 || window.orientation === 180) {
      orientation = 'portrait';
    } else if (window.orientation === 90 || window.orientation === -90) {
      orientation = 'landscape';
    }

    return orientation;
  }
});

module.exports = Base;

},{}],8:[function(require,module,exports){
var Base = require('../base');

var BaseIcon = Base.extend({

  constructor: function(options) {
    this.base(options);

    if (this.navigationOnRoute) {
      this.bindAll(this, 'navigationOnRoute');
      ffwdme.on('navigation:onroute', this.navigationOnRoute);
    }

    this.render();
  },

  iconSrc: function() {
    return this.getRetinaImageUrl(ffwdme.defaults.imageBaseUrl + this.icon);
  },

  icon: null,

  defaultUnit: null,

  classes: 'ffwdme-grid-w3 ffwdme-grid-h1 ffwdme-components-icon',

  accessor: function(selector, val) {
    var el = this.$(selector);
    if (typeof val === 'undefined') return el.html();
    el.html(val);
    return el;
  },

  label: function(val) {
    return this.accessor('.ffwdme-components-label', val);
  },

  unit: function(val) {
    return this.accessor('.ffwdme-components-label-unit', val);
  },

  make: function(){
    this.base();

    var content = [
      '<span class="ffwdme-components-icon-container"><img class="ffwdme-components-icon-img" src="', this.iconSrc(), '" /></span>',
      '<span class="ffwdme-components-label">-</span>',
      '<span class="ffwdme-components-label-unit"> ', this.defaultUnit, '</span>'
    ].join('');

    $(this.el).addClass('ffwdme-components-container').html(content);
    return this;
  }
});

module.exports = BaseIcon;

},{"../base":7}],9:[function(require,module,exports){
var Base = require('../base');

var BaseWide = Base.extend({

  constructor: function(options) {
    this.base(options);

    if (this.navigationOnRoute) {
      this.bindAll(this, 'navigationOnRoute');
      ffwdme.on('navigation:onroute', this.navigationOnRoute);
    }

    this.render();
  },

  make: function(){
    this.base();
    $(this.el).addClass('ffwdme-components-container').html('<span class="ffwdme-components-text"></span>');
    return this;
  },

  classes: null
});

module.exports = BaseWide;

},{"../base":7}],10:[function(require,module,exports){
var BaseIcon = require('../base_icon');

var DistanceToDestination = BaseIcon.extend({

  icon: 'distance_to_destination/road.svg',

  defaultUnit: 'km',

  format: function(distance) {
    var unit = ' m';

    // 1243 m = 1.2 km
    if (distance > 1000) {
      distance = (distance/1000).toFixed(1);
      unit = ' km';
    // 859 m = 900 m
    } else if (distance > 500) {
      distance = (distance/1000).toFixed(1) * 1000;
    // 123 m = 120 m
    } else {
      distance = (distance/1000).toFixed(2) * 1000;
    }

    return {
      distance: distance,
      unit: unit
    };
  },

  navigationOnRoute: function(e) {
    var distance = e.navInfo.distanceToDestination;
    if (!distance) return;

    var formatted = this.format(distance);

    this.label(formatted.distance);
    this.unit(formatted.unit);
  }
});

module.exports = DistanceToDestination;

},{"../base_icon":8}],11:[function(require,module,exports){
var BaseWide = require('../base_wide');
var DistanceToDestination = require('../distance_to_destination');

var DistanceToNextTurn = BaseWide.extend({

  classes: 'ffwdme-components-container ffwdme-grid-w9 ffwdme-grid-h1 ffwdme-components-text-only ffwdme-components-big-typo',

  format: DistanceToDestination.prototype.format,

  navigationOnRoute: function(e) {
    var distance = e.navInfo.distanceToNextDirection;
    if (!distance) return;

    var formatted = this.format(distance);
    $(this.el).find('.ffwdme-components-text').html([formatted.distance, formatted.unit].join(' '));
  }
});

module.exports = DistanceToNextTurn;

},{"../base_wide":9,"../distance_to_destination":10}],12:[function(require,module,exports){
var Base = require('./base');
var Arrow = require('./arrow');
var ArrivalTime = require('./arrival_time');
var AudioInstructions = require('./audio_instructions');
var AutoReroute = require('./auto_reroute');
var AutoZoom = require('./auto_zoom');
var DistanceToDestination = require('./distance_to_destination');
var DistanceToNextTurn = require('./distance_to_next_turn');
var Leaflet = require('./leaflet');
var MapRotator = require('./map_rotator');
var NextStreet = require('./next_street');
var RouteOverview = require('./route_overview');
var Speed = require('./speed');
var Zoom = require('./zoom');
var TimeToDestination = require('./time_to_destination');

;(function(ffwdme){
  ffwdme.components = {
    Base: Base,
    ArrivalTime: ArrivalTime,
    Arrow: Arrow,
    AudioInstructions: AudioInstructions,
    AutoReroute: AutoReroute,
    AutoZoom: AutoZoom,
    DistanceToDestination: DistanceToDestination,
    DistanceToNextTurn: DistanceToNextTurn,
    Leaflet: Leaflet,
    MapRotator: MapRotator,
    NextStreet: NextStreet,
    RouteOverview: RouteOverview,
    Speed: Speed,
    TimeToDestination: TimeToDestination,
    Zoom: Zoom
  };
})(ffwdme);

},{"./arrival_time":1,"./arrow":2,"./audio_instructions":3,"./auto_reroute":5,"./auto_zoom":6,"./base":7,"./distance_to_destination":10,"./distance_to_next_turn":11,"./leaflet":13,"./map_rotator":14,"./next_street":15,"./route_overview":16,"./speed":17,"./time_to_destination":18,"./zoom":19}],13:[function(require,module,exports){
var Base = require('../base');

var Leaflet = Base.extend({
  /**
   * Max Zoom is 18
   * @augments ffwdme.Class
   * @constructs
   *
   */
  constructor: function(options) {
    this.base(options);
    this.bindAll(this, 'resize', 'drawRoute', 'drawMarkerWithoutRoute', 'onRouteSuccess', 'navigationOnRoute', 'navigationOffRoute', 'rotateMarker', 'setupMap');

    Leaflet.defineLeafletExtensions();

    this.mapReadyCallbacks = [];

    this.setupMap();

    ffwdme.on('geoposition:update', this.drawMarkerWithoutRoute);
    ffwdme.on('routecalculation:success', this.onRouteSuccess);
    ffwdme.on('routecalculation:success', this.drawRoute);
    ffwdme.on('reroutecalculation:success', this.drawRoute);
  },

  attrAccessible: ['el', 'apiKey'],

  map: null,

  polylines: null,

  helpLine: null,

  marker: null,

  markerIcon: null,

  zoomLevel: 17,

  inRoutingMode: false,

  inRouteOverview: false,

  mapReady: false,

  mapReadyCallbacks: null,

  userZoom: 0,

  canControlMap: function(component) {
    if (component instanceof ffwdme.components.AutoZoom && this.inRouteOverview) { return false; }
    if (component instanceof ffwdme.components.MapRotator && this.inRouteOverview) { return false; }
    return true;
  },

  setupEventsOnMapReady: function() {
    ffwdme.on('navigation:onroute', this.navigationOnRoute);
    ffwdme.on('navigation:offroute', this.navigationOffRoute);
    ffwdme.on('geoposition:update', this.rotateMarker);
  },

  setupMap: function() {
    var destination = new L.LatLng(this.options.center.lat, this.options.center.lng);

    this.map = new L.Map(this.el.attr('id'), {
      attributionControl: false,
      zoomControl: false
    });

    L.tileLayer(this.options.tileURL, {
      minZoom: 10,
      maxZoom: 18,
    }).addTo(this.map);

    if(!this.options.disableLeafletLocate) {
      this.map.locate({setView: true, maxZoom: 17});
    }

    this.setupEventsOnMapReady();

    for (var i = 0; i < this.mapReadyCallbacks.length; i++) {
      this.mapReadyCallbacks[i]();
    }

    this.mapReadyCallbacks = [];

    this.mapReady = true;
  },

  hideMarker: function() {
    this.marker && $(this.marker._icon).hide();
  },

  rotateMarker: function(e) {
    var heading = e.geoposition.coords.heading;
    heading && this.marker && this.marker.setIconAngle(heading);
  },

  drawMarkerWithoutRoute: function(e) {
    if (this.inRoutingMode) return;

    var markerIcon;

    if (!this.marker) {
      markerIcon = new L.Icon({
        iconUrl: ffwdme.defaults.imageBaseUrl + 'leaflet/map_marker.png',
        shadowUrl: ffwdme.defaults.imageBaseUrl + 'leaflet/map_marker_shadow.png',
        iconSize: new L.Point(40, 40),
        shadowSize: new L.Point(40, 40),
        iconAnchor: new L.Point(20, 20),
        popupAnchor: new L.Point(-3, -76)
      });

      this.marker = new L.Compass(e.point, { icon: markerIcon });
      this.disableMarker || this.map.addLayer(this.marker);
    } else {
      this.drawMarkerOnMap(e.point.lat, e.point.lng, true);
    }
  },

  drawRoute: function(e) {
    if (!this.mapReady) {
      var self = this;
      this.mapReadyCallbacks.push(function() {
        self.removeHelpLine();
        self.drawPolylineOnMap(e.route, false);
      });
      return;
    }


    this.removeHelpLine();
    this.drawPolylineOnMap(e.route, false);
  },

  onRouteSuccess: function(e) {
    this.inRoutingMode = true;

    var destination = e.route.destination();

    var finishMarkerIcon = new L.Icon({
      iconUrl: ffwdme.defaults.imageBaseUrl + 'leaflet/map_marker_finish.png',
      shadowUrl: ffwdme.defaults.imageBaseUrl + 'leaflet/map_marker_shadow.png',
      iconSize: new L.Point(32, 32),
      shadowSize: new L.Point(32, 32),
      iconAnchor: new L.Point(16, 32),
      popupAnchor: new L.Point(-3, -76)
    });

    this.finishMarker = new L.Marker(destination, { icon: finishMarkerIcon });
    this.map.addLayer(this.finishMarker);
  },

  navigationOnRoute: function(e) {
    var p = e.navInfo.position;
    this.removeHelpLine();
    this.drawMarkerOnMap(p.lat, p.lng, true);
  },

  navigationOffRoute: function(e) {
    var p = e.navInfo.positionRaw;
    this.drawMarkerOnMap(p.lat, p.lng, true);
    this.drawHelpLine(e.navInfo.positionRaw, e.navInfo.position);
  },

  drawPolylineOnMap: function(route, center){
    var directions = route.directions, len = directions.length, len2, path;

    var point, latlngs = [];
    for (var i = 0; i < len; i++) {
      if (directions[i].path) {
        path = directions[i].path;
        len2 = path.length;
        for (var j = 0; j < len2; j++) {
          latlngs.push(new L.LatLng(path[j].lat, path[j].lng));
        }
      }
    }

    if (!this.polylines) {
      this.polylines = {};

      this.polylines.underlay = new L.Polyline(latlngs, { color: 'red', opacity: 1, weight: 8  });
      this.polylines.overlay  = new L.Polyline(latlngs, { color: 'white', opacity: 1, weight: 4 });

      this.map.addLayer(this.polylines.underlay);
      this.map.addLayer(this.polylines.overlay);
    } else {
      this.polylines.underlay.setLatLngs(latlngs);
      this.polylines.overlay.setLatLngs(latlngs);
    }

    // zoom the map to the polyline
    if (center && !this.inRouteOverview) this.map.fitBounds(new L.LatLngBounds(latlngs));
  },

  drawMarkerOnMap: function(lat, lng, center){
    var loc = new L.LatLng(lat, lng);
    this.marker.setLatLng(loc);
    if (center && !this.inRouteOverview) {
      this.map.setView(loc, this.getZoom());
    } else {
      this.map.fitBounds(this.polylines.overlay.getBounds());
    }
  },

  removeHelpLine: function() {
    this.helpLine && this.map.removeLayer(this.helpLine);
  },

  drawHelpLine: function(rawPos, desiredPos) {
    var latlngs = [
      new L.LatLng(rawPos.lat,      rawPos.lng),
      new L.LatLng(desiredPos.lat,  desiredPos.lng)
    ];

    if (!this.helpLine) {
      this.helpLine = new L.Polyline(latlngs, { color: 'red', opacity: 0.5, weight: 2  });
      this.map.addLayer(this.helpLine);
    } else {
      this.helpLine.setLatLngs(latlngs);
      this.map.addLayer(this.helpLine);
    }
  },

  changeUserZoom: function(value){
    this.userZoom += value;
  },

  getZoom: function() {
    return this.zoomLevel + this.userZoom;
  },

  setZoom: function(zoom) {
    this.zoomLevel = zoom;
    return this.zoomLevel;
  },

  setMapContainerSize: function(width, height, top, left, rotate){
    this.el && this.el.animate({ rotate: rotate + 'deg' });
    this.el.css({
      width: width + 'px',
      height: height + 'px',
      top: top,
      left: left
    });
    if (this.map) this.map._onResize();
  },

  toggleRouteOverview: function(){
    this.inRouteOverview = !this.inRouteOverview;

    if (this.inRouteOverview){
      this.setMapContainerSize($(window).width(), $(window).height(), 0, 0, 0);
    }
    return this.inRouteOverview;
  }

}, {
  defineLeafletExtensions: function() {

    // see https://github.com/CloudMade/Leaflet/issues/386
    L.Compass = L.Marker
    .extend({

      setIconAngle: function (iconAngle) {
        this.options.iconAngle = iconAngle;
        this.update();
      },

      _setPos: function(pos) {
        L.Marker.prototype._setPos.call(this, pos);

        var iconAngle = this.options.iconAngle;

        if (iconAngle) {
          this._icon.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(pos) + ' rotate(' + iconAngle + 'deg)';
        }
      }
    });

  }
});

module.exports = Leaflet;

},{"../base":7}],14:[function(require,module,exports){
var Base = require('../base');

var MapRotator = Base.extend({

  constructor: function(options) {
    this.base(options);
    this.bindAll(this,'rotateMap', 'setupRotation');

    $(window).on('resize', this.setupRotation);
    ffwdme.on('geoposition:update', this.rotateMap);

    this.setupRotation();
  },

  attrAccessible: ['map'],

  rotating: false,

  setupRotation: function() {
    if (!this.map.canControlMap(this)) return;
    var size = Math.ceil(Math.sqrt(Math.pow($(window).width(), 2) + Math.pow($(window).height(), 2)));
    this.map.setMapContainerSize(size, size, (($(window).height() - size) / 2), (($(window).width() - size) / 2), 0);
  },

  rotateMap: function(e) {
    if (!this.map.canControlMap(this)){
      this.rotating = false;
      return;
    }

    //has control first time
    if (this.rotating === false){
      this.setupRotation();
      this.rotating = true;
    }

    var heading = - e.geoposition.coords.heading;
    heading && this.map.el && this.map.el.animate({ rotate: heading + 'deg' }, 1000, 'ease-in-out');

  }

});

module.exports = MapRotator;

},{"../base":7}],15:[function(require,module,exports){
var BaseWide = require('../base_wide');

var NextStreet = BaseWide.extend({

  classes: 'ffwdme-components-container ffwdme-components-text-only ffwdme-grid-w9 ffwdme-grid-h1',

  showNextStreet: function(e) {
    $(this.el).find('.ffwdme-components-text')
      .html(e.navInfo.nextDirection.street)
      .css('background', '');
  },

  showFinalStreet: function(e) {
    $(this.el).find('.ffwdme-components-text')
      .html(e.navInfo.currentDirection.street);
  },

  navigationOnRoute: function(e) {
    if (e.navInfo.finalDirection === true) {
      this.showFinalStreet(e);
    } else if (e.navInfo.nextDirection && e.navInfo.nextDirection.street) {
      this.showNextStreet(e);
    }
  }
});

module.exports = NextStreet;

},{"../base_wide":9}],16:[function(require,module,exports){
var Base = require('../base');

var RouteOverview = Base.extend({

  constructor: function(options) {
    this.base(options);
    this.render();
  },

  attrAccessible: ['map', 'grid'],

  iconEl: null,

  icon: 'route_overview/map.svg',

  iconPosition: 'route_overview/position.svg',

  iconRouteOverview: 'route_overview/map.svg',

  classes: 'ffwdme-components-container ffwdme-grid-w2 ffwdme-grid-h1 ffwdme-components-route-overview',

  toggleOverview: function(e){
    if (!this.map || !this.map.canControlMap(this)) return;

    this.icon = (this.map.toggleRouteOverview()) ? this.iconPosition : this.iconRouteOverview;
    this.setIcon();
    this.setOpacity();
  },


  imgUrl: function(){
    return this.getRetinaImageUrl(ffwdme.defaults.imageBaseUrl + this.icon);
  },

  setOpacity: function(){
    var widgets = $(".ffwdme-components-container");
    if (this.map.inRouteOverview){
      widgets.addClass("ffwdme-in-route-overview");
    }else{
      widgets.removeClass("ffwdme-in-route-overview");
    }
  },

  setIcon: function() {
    if (!this.iconEl) {
      var img = document.createElement('img');
      this.iconEl = $(img).addClass('ffwdme-components-route-overview-image').appendTo($(this.el));
    }
    this.iconEl[0].src = this.imgUrl();
  },

  make: function(){
    this.base();
    var self = this;
    $(this.el).click(function(e) { e.stopPropagation(); self.toggleOverview(); });
    this.setIcon();
    return this;
  }

});

module.exports = RouteOverview;

},{"../base":7}],17:[function(require,module,exports){
var BaseIcon = require('../base_icon');

var Speed = BaseIcon.extend({

  icon: 'speed/car.svg',

  defaultUnit: 'km/h',

  format: function(metersPerSecond) {
    return Math.round(metersPerSecond*3.6);
  },

  navigationOnRoute: function(e) {
    var speed = e.navInfo.raw.geoposition.coords.speed;
    if (speed) this.label(this.format(speed));
  }
});

module.exports = Speed;

},{"../base_icon":8}],18:[function(require,module,exports){
var BaseIcon = require('../base_icon');

var TimeToDestination = BaseIcon.extend({

  icon: 'time_to_destination/flag.svg',

  defaultUnit: 'h',

  format: function(completeSeconds) {
    var completeMinutes = Math.round(completeSeconds/60),
        mins = completeMinutes % 60,
        hrs  = (completeMinutes - mins) / 60;
        mins = mins < 10 ? '0' + mins : mins;
    return [hrs, ":", mins].join("");
  },

  navigationOnRoute: function(e) {
    var timeLeft = e.navInfo.timeToDestination;
    if (timeLeft) this.label(this.format(timeLeft));
  }
});

module.exports = TimeToDestination;

},{"../base_icon":8}],19:[function(require,module,exports){
var Base = require('../base');

var Zoom = Base.extend({

  constructor: function(options) {
    this.base(options);
    this.render();
  },

  attrAccessible: ['map', 'grid'],

  iconElZoomIn: null,

  iconElZoomOut: null,

  iconZoomIn: 'zoom/plus.svg',

  iconZoomOut: 'zoom/minus.svg',

  classes: 'ffwdme-components-container ffwdme-components-zoom-container ffwdme-grid-w3 ffwdme-grid-h1',

  imgUrl: function(icon){
    return this.getRetinaImageUrl(ffwdme.defaults.imageBaseUrl + icon);
  },

  zoom: function(val){
    this.map && this.map.changeUserZoom(val);
    ffwdme.geolocation.last && ffwdme.trigger('geoposition:update', ffwdme.geolocation.last);
  },

  setIcons: function() {
    var img;

    if (!this.iconElZoomIn) {
      img = document.createElement('img');
      this.iconElZoomIn = $(img).addClass('ffwdme-components-zoom').appendTo($(this.el));
    }
    this.iconElZoomIn[0].src = this.imgUrl(this.iconZoomIn);

    if (!this.iconElZoomOut) {
      img = document.createElement('img');
      this.iconElZoomOut = $(img).addClass('ffwdme-components-zoom').appendTo($(this.el));
    }
    this.iconElZoomOut[0].src = this.imgUrl(this.iconZoomOut);
  },

  make: function(){
    this.base();
    var self = this;
    this.setIcons();
    $(this.iconElZoomIn).click(function(e) { e.stopPropagation(); self.zoom(1);});
    $(this.iconElZoomOut).click(function(e) { e.stopPropagation(); self.zoom(-1);});
    return this;
  }

});

module.exports = Zoom;

},{"../base":7}]},{},[12]);
