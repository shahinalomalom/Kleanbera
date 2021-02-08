 
/**
 * Parallax.js
 * @author Matthew Wagerfield - @wagerfield
 * @description Creates a parallax effect between an array of layers
 */
;(function(window, document, undefined) {

    // Strict Mode
    'use strict';
  
    // Constants
    var NAME = 'Parallax';
    var MAGIC_NUMBER = 30;
    var DEFAULTS = {
      relativeInput: false,
      clipRelativeInput: false,
      calibrationThreshold: 100,
      calibrationDelay: 500,
      supportDelay: 500,
      calibrateX: false,
      calibrateY: true,
      invertX: true,
      invertY: true,
      limitX: false,
      limitY: false,
      scalarX: 10.0,
      scalarY: 10.0,
      frictionX: 0.1,
      frictionY: 0.1,
      originX: 0.5,
      originY: 0.5
    };
  
    function Parallax(element, options) {
  
      // DOM Context
      this.element = element;
      this.layers = element.getElementsByClassName('layer');
  
      // Data Extraction
      var data = {
        calibrateX: this.data(this.element, 'calibrate-x'),
        calibrateY: this.data(this.element, 'calibrate-y'),
        invertX: this.data(this.element, 'invert-x'),
        invertY: this.data(this.element, 'invert-y'),
        limitX: this.data(this.element, 'limit-x'),
        limitY: this.data(this.element, 'limit-y'),
        scalarX: this.data(this.element, 'scalar-x'),
        scalarY: this.data(this.element, 'scalar-y'),
        frictionX: this.data(this.element, 'friction-x'),
        frictionY: this.data(this.element, 'friction-y'),
        originX: this.data(this.element, 'origin-x'),
        originY: this.data(this.element, 'origin-y')
      };
  
      // Delete Null Data Values
      for (var key in data) {
        if (data[key] === null) delete data[key];
      }
  
      // Compose Settings Object
      this.extend(this, DEFAULTS, options, data);
  
      // States
      this.calibrationTimer = null;
      this.calibrationFlag = true;
      this.enabled = false;
      this.depths = [];
      this.raf = null;
  
      // Element Bounds
      this.bounds = null;
      this.ex = 0;
      this.ey = 0;
      this.ew = 0;
      this.eh = 0;
  
      // Element Center
      this.ecx = 0;
      this.ecy = 0;
  
      // Element Range
      this.erx = 0;
      this.ery = 0;
  
      // Calibration
      this.cx = 0;
      this.cy = 0;
  
      // Input
      this.ix = 0;
      this.iy = 0;
  
      // Motion
      this.mx = 0;
      this.my = 0;
  
      // Velocity
      this.vx = 0;
      this.vy = 0;
  
      // Callbacks
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
      this.onOrientationTimer = this.onOrientationTimer.bind(this);
      this.onCalibrationTimer = this.onCalibrationTimer.bind(this);
      this.onAnimationFrame = this.onAnimationFrame.bind(this);
      this.onWindowResize = this.onWindowResize.bind(this);
  
      // Initialise
      this.initialise();
    }
  
    Parallax.prototype.extend = function() {
      if (arguments.length > 1) {
        var master = arguments[0];
        for (var i = 1, l = arguments.length; i < l; i++) {
          var object = arguments[i];
          for (var key in object) {
            master[key] = object[key];
          }
        }
      }
    };
  
    Parallax.prototype.data = function(element, name) {
      return this.deserialize(element.getAttribute('data-'+name));
    };
  
    Parallax.prototype.deserialize = function(value) {
      if (value === 'true') {
        return true;
      } else if (value === 'false') {
        return false;
      } else if (value === 'null') {
        return null;
      } else if (!isNaN(parseFloat(value)) && isFinite(value)) {
        return parseFloat(value);
      } else {
        return value;
      }
    };
  
    Parallax.prototype.camelCase = function(value) {
      return value.replace(/-+(.)?/g, function(match, character){
        return character ? character.toUpperCase() : '';
      });
    };
  
    Parallax.prototype.transformSupport = function(value) {
      var element = document.createElement('div');
      var propertySupport = false;
      var propertyValue = null;
      var featureSupport = false;
      var cssProperty = null;
      var jsProperty = null;
      for (var i = 0, l = this.vendors.length; i < l; i++) {
        if (this.vendors[i] !== null) {
          cssProperty = this.vendors[i][0] + 'transform';
          jsProperty = this.vendors[i][1] + 'Transform';
        } else {
          cssProperty = 'transform';
          jsProperty = 'transform';
        }
        if (element.style[jsProperty] !== undefined) {
          propertySupport = true;
          break;
        }
      }
      switch(value) {
        case '2D':
          featureSupport = propertySupport;
          break;
        case '3D':
          if (propertySupport) {
            var body = document.body || document.createElement('body');
            var documentElement = document.documentElement;
            var documentOverflow = documentElement.style.overflow;
            if (!document.body) {
              documentElement.style.overflow = 'hidden';
              documentElement.appendChild(body);
              body.style.overflow = 'hidden';
              body.style.background = '';
            }
            body.appendChild(element);
            element.style[jsProperty] = 'translate3d(1px,1px,1px)';
            propertyValue = window.getComputedStyle(element).getPropertyValue(cssProperty);
            featureSupport = propertyValue !== undefined && propertyValue.length > 0 && propertyValue !== 'none';
            documentElement.style.overflow = documentOverflow;
            body.removeChild(element);
          }
          break;
      }
      return featureSupport;
    };
  
    Parallax.prototype.ww = null;
    Parallax.prototype.wh = null;
    Parallax.prototype.wcx = null;
    Parallax.prototype.wcy = null;
    Parallax.prototype.wrx = null;
    Parallax.prototype.wry = null;
    Parallax.prototype.portrait = null;
    Parallax.prototype.desktop = !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i);
    Parallax.prototype.vendors = [null,['-webkit-','webkit'],['-moz-','Moz'],['-o-','O'],['-ms-','ms']];
    Parallax.prototype.motionSupport = !!window.DeviceMotionEvent;
    Parallax.prototype.orientationSupport = !!window.DeviceOrientationEvent;
    Parallax.prototype.orientationStatus = 0;
    Parallax.prototype.propertyCache = {};
  
    Parallax.prototype.initialise = function() {
  
      if (Parallax.prototype.transform2DSupport === undefined) {
        Parallax.prototype.transform2DSupport = Parallax.prototype.transformSupport('2D');
        Parallax.prototype.transform3DSupport = Parallax.prototype.transformSupport('3D');
      }
  
      // Configure Context Styles
      if (this.transform3DSupport) this.accelerate(this.element);
      var style = window.getComputedStyle(this.element);
      if (style.getPropertyValue('position') === 'static') {
        this.element.style.position = 'relative';
      }
  
      // Setup
      this.updateLayers();
      this.updateDimensions();
      this.enable();
      this.queueCalibration(this.calibrationDelay);
    };
  
    Parallax.prototype.updateLayers = function() {
  
      // Cache Layer Elements
      this.layers = this.element.getElementsByClassName('layer');
      this.depths = [];
  
      // Configure Layer Styles
      for (var i = 0, l = this.layers.length; i < l; i++) {
        var layer = this.layers[i];
        if (this.transform3DSupport) this.accelerate(layer);
        layer.style.position = i ? 'absolute' : 'relative';
        layer.style.display = 'block';
        layer.style.left = 0;
        layer.style.top = 0;
  
        // Cache Layer Depth
        this.depths.push(this.data(layer, 'depth') || 0);
      }
    };
  
    Parallax.prototype.updateDimensions = function() {
      this.ww = window.innerWidth;
      this.wh = window.innerHeight;
      this.wcx = this.ww * this.originX;
      this.wcy = this.wh * this.originY;
      this.wrx = Math.max(this.wcx, this.ww - this.wcx);
      this.wry = Math.max(this.wcy, this.wh - this.wcy);
    };
  
    Parallax.prototype.updateBounds = function() {
      this.bounds = this.element.getBoundingClientRect();
      this.ex = this.bounds.left;
      this.ey = this.bounds.top;
      this.ew = this.bounds.width;
      this.eh = this.bounds.height;
      this.ecx = this.ew * this.originX;
      this.ecy = this.eh * this.originY;
      this.erx = Math.max(this.ecx, this.ew - this.ecx);
      this.ery = Math.max(this.ecy, this.eh - this.ecy);
    };
  
    Parallax.prototype.queueCalibration = function(delay) {
      clearTimeout(this.calibrationTimer);
      this.calibrationTimer = setTimeout(this.onCalibrationTimer, delay);
    };
  
    Parallax.prototype.enable = function() {
      if (!this.enabled) {
        this.enabled = true;
        if (this.orientationSupport) {
          this.portrait = null;
          window.addEventListener('deviceorientation', this.onDeviceOrientation);
          setTimeout(this.onOrientationTimer, this.supportDelay);
        } else {
          this.cx = 0;
          this.cy = 0;
          this.portrait = false;
          window.addEventListener('mousemove', this.onMouseMove);
        }
        window.addEventListener('resize', this.onWindowResize);
        this.raf = requestAnimationFrame(this.onAnimationFrame);
      }
    };
  
    Parallax.prototype.disable = function() {
      if (this.enabled) {
        this.enabled = false;
        if (this.orientationSupport) {
          window.removeEventListener('deviceorientation', this.onDeviceOrientation);
        } else {
          window.removeEventListener('mousemove', this.onMouseMove);
        }
        window.removeEventListener('resize', this.onWindowResize);
        cancelAnimationFrame(this.raf);
      }
    };
  
    Parallax.prototype.calibrate = function(x, y) {
      this.calibrateX = x === undefined ? this.calibrateX : x;
      this.calibrateY = y === undefined ? this.calibrateY : y;
    };
  
    Parallax.prototype.invert = function(x, y) {
      this.invertX = x === undefined ? this.invertX : x;
      this.invertY = y === undefined ? this.invertY : y;
    };
  
    Parallax.prototype.friction = function(x, y) {
      this.frictionX = x === undefined ? this.frictionX : x;
      this.frictionY = y === undefined ? this.frictionY : y;
    };
  
    Parallax.prototype.scalar = function(x, y) {
      this.scalarX = x === undefined ? this.scalarX : x;
      this.scalarY = y === undefined ? this.scalarY : y;
    };
  
    Parallax.prototype.limit = function(x, y) {
      this.limitX = x === undefined ? this.limitX : x;
      this.limitY = y === undefined ? this.limitY : y;
    };
  
    Parallax.prototype.origin = function(x, y) {
      this.originX = x === undefined ? this.originX : x;
      this.originY = y === undefined ? this.originY : y;
    };
  
    Parallax.prototype.clamp = function(value, min, max) {
      value = Math.max(value, min);
      value = Math.min(value, max);
      return value;
    };
  
    Parallax.prototype.css = function(element, property, value) {
      var jsProperty = this.propertyCache[property];
      if (!jsProperty) {
        for (var i = 0, l = this.vendors.length; i < l; i++) {
          if (this.vendors[i] !== null) {
            jsProperty = this.camelCase(this.vendors[i][1] + '-' + property);
          } else {
            jsProperty = property;
          }
          if (element.style[jsProperty] !== undefined) {
            this.propertyCache[property] = jsProperty;
            break;
          }
        }
      }
      element.style[jsProperty] = value;
    };
  
    Parallax.prototype.accelerate = function(element) {
      this.css(element, 'transform', 'translate3d(0,0,0)');
      this.css(element, 'transform-style', 'preserve-3d');
      this.css(element, 'backface-visibility', 'hidden');
    };
  
    Parallax.prototype.setPosition = function(element, x, y) {
      x += 'px';
      y += 'px';
      if (this.transform3DSupport) {
        this.css(element, 'transform', 'translate3d('+x+','+y+',0)');
      } else if (this.transform2DSupport) {
        this.css(element, 'transform', 'translate('+x+','+y+')');
      } else {
        element.style.left = x;
        element.style.top = y;
      }
    };
  
    Parallax.prototype.onOrientationTimer = function() {
      if (this.orientationSupport && this.orientationStatus === 0) {
        this.disable();
        this.orientationSupport = false;
        this.enable();
      }
    };
  
    Parallax.prototype.onCalibrationTimer = function() {
      this.calibrationFlag = true;
    };
  
    Parallax.prototype.onWindowResize = function() {
      this.updateDimensions();
    };
  
    Parallax.prototype.onAnimationFrame = function() {
      this.updateBounds();
      var dx = this.ix - this.cx;
      var dy = this.iy - this.cy;
      if ((Math.abs(dx) > this.calibrationThreshold) || (Math.abs(dy) > this.calibrationThreshold)) {
        this.queueCalibration(0);
      }
      if (this.portrait) {
        this.mx = this.calibrateX ? dy : this.iy;
        this.my = this.calibrateY ? dx : this.ix;
      } else {
        this.mx = this.calibrateX ? dx : this.ix;
        this.my = this.calibrateY ? dy : this.iy;
      }
      this.mx *= this.ew * (this.scalarX / 100);
      this.my *= this.eh * (this.scalarY / 100);
      if (!isNaN(parseFloat(this.limitX))) {
        this.mx = this.clamp(this.mx, -this.limitX, this.limitX);
      }
      if (!isNaN(parseFloat(this.limitY))) {
        this.my = this.clamp(this.my, -this.limitY, this.limitY);
      }
      this.vx += (this.mx - this.vx) * this.frictionX;
      this.vy += (this.my - this.vy) * this.frictionY;
      for (var i = 0, l = this.layers.length; i < l; i++) {
        var layer = this.layers[i];
        var depth = this.depths[i];
        var xOffset = this.vx * depth * (this.invertX ? -1 : 1);
        var yOffset = this.vy * depth * (this.invertY ? -1 : 1);
        this.setPosition(layer, xOffset, yOffset);
      }
      this.raf = requestAnimationFrame(this.onAnimationFrame);
    };
  
    Parallax.prototype.onDeviceOrientation = function(event) {
  
      // Validate environment and event properties.
      if (!this.desktop && event.beta !== null && event.gamma !== null) {
  
        // Set orientation status.
        this.orientationStatus = 1;
  
        // Extract Rotation
        var x = (event.beta  || 0) / MAGIC_NUMBER; //  -90 :: 90
        var y = (event.gamma || 0) / MAGIC_NUMBER; // -180 :: 180
  
        // Detect Orientation Change
        var portrait = this.wh > this.ww;
        if (this.portrait !== portrait) {
          this.portrait = portrait;
          this.calibrationFlag = true;
        }
  
        // Set Calibration
        if (this.calibrationFlag) {
          this.calibrationFlag = false;
          this.cx = x;
          this.cy = y;
        }
  
        // Set Input
        this.ix = x;
        this.iy = y;
      }
    };
  
    Parallax.prototype.onMouseMove = function(event) {
  
      // Cache mouse coordinates.
      var clientX = event.clientX;
      var clientY = event.clientY;
  
      // Calculate Mouse Input
      if (!this.orientationSupport && this.relativeInput) {
  
        // Clip mouse coordinates inside element bounds.
        if (this.clipRelativeInput) {
          clientX = Math.max(clientX, this.ex);
          clientX = Math.min(clientX, this.ex + this.ew);
          clientY = Math.max(clientY, this.ey);
          clientY = Math.min(clientY, this.ey + this.eh);
        }
  
        // Calculate input relative to the element.
        this.ix = (clientX - this.ex - this.ecx) / this.erx;
        this.iy = (clientY - this.ey - this.ecy) / this.ery;
  
      } else {
  
        // Calculate input relative to the window.
        this.ix = (clientX - this.wcx) / this.wrx;
        this.iy = (clientY - this.wcy) / this.wry;
      }
    };
  
    // Expose Parallax
    window[NAME] = Parallax;
  
  })(window, document);
  
  /**
   * Request Animation Frame Polyfill.
   * @author Tino Zijdel
   * @author Paul Irish
   * @see https://gist.github.com/paulirish/1579671
   */
  ;(function() {
  
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
  
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
      window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
      window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
  
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() { callback(currTime + timeToCall); },
          timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    }
  
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }
  
  }());

  


/*! Stellar.js v0.6.2 | Copyright 2014, Mark Dalgleish | http://markdalgleish.com/projects/stellar.js | http://markdalgleish.mit-license.org */
!function(a,b,c,d){function e(b,c){this.element=b,this.options=a.extend({},g,c),this._defaults=g,this._name=f,this.init()}var f="stellar",g={scrollProperty:"scroll",positionProperty:"position",horizontalScrolling:!0,verticalScrolling:!0,horizontalOffset:0,verticalOffset:0,responsive:!1,parallaxBackgrounds:!0,parallaxElements:!0,hideDistantElements:!0,hideElement:function(a){a.hide()},showElement:function(a){a.show()}},h={scroll:{getLeft:function(a){return a.scrollLeft()},setLeft:function(a,b){a.scrollLeft(b)},getTop:function(a){return a.scrollTop()},setTop:function(a,b){a.scrollTop(b)}},position:{getLeft:function(a){return-1*parseInt(a.css("left"),10)},getTop:function(a){return-1*parseInt(a.css("top"),10)}},margin:{getLeft:function(a){return-1*parseInt(a.css("margin-left"),10)},getTop:function(a){return-1*parseInt(a.css("margin-top"),10)}},transform:{getLeft:function(a){var b=getComputedStyle(a[0])[k];return"none"!==b?-1*parseInt(b.match(/(-?[0-9]+)/g)[4],10):0},getTop:function(a){var b=getComputedStyle(a[0])[k];return"none"!==b?-1*parseInt(b.match(/(-?[0-9]+)/g)[5],10):0}}},i={position:{setLeft:function(a,b){a.css("left",b)},setTop:function(a,b){a.css("top",b)}},transform:{setPosition:function(a,b,c,d,e){a[0].style[k]="translate3d("+(b-c)+"px, "+(d-e)+"px, 0)"}}},j=function(){var b,c=/^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/,d=a("script")[0].style,e="";for(b in d)if(c.test(b)){e=b.match(c)[0];break}return"WebkitOpacity"in d&&(e="Webkit"),"KhtmlOpacity"in d&&(e="Khtml"),function(a){return e+(e.length>0?a.charAt(0).toUpperCase()+a.slice(1):a)}}(),k=j("transform"),l=a("<div />",{style:"background:#fff"}).css("background-position-x")!==d,m=l?function(a,b,c){a.css({"background-position-x":b,"background-position-y":c})}:function(a,b,c){a.css("background-position",b+" "+c)},n=l?function(a){return[a.css("background-position-x"),a.css("background-position-y")]}:function(a){return a.css("background-position").split(" ")},o=b.requestAnimationFrame||b.webkitRequestAnimationFrame||b.mozRequestAnimationFrame||b.oRequestAnimationFrame||b.msRequestAnimationFrame||function(a){setTimeout(a,1e3/60)};e.prototype={init:function(){this.options.name=f+"_"+Math.floor(1e9*Math.random()),this._defineElements(),this._defineGetters(),this._defineSetters(),this._handleWindowLoadAndResize(),this._detectViewport(),this.refresh({firstLoad:!0}),"scroll"===this.options.scrollProperty?this._handleScrollEvent():this._startAnimationLoop()},_defineElements:function(){this.element===c.body&&(this.element=b),this.$scrollElement=a(this.element),this.$element=this.element===b?a("body"):this.$scrollElement,this.$viewportElement=this.options.viewportElement!==d?a(this.options.viewportElement):this.$scrollElement[0]===b||"scroll"===this.options.scrollProperty?this.$scrollElement:this.$scrollElement.parent()},_defineGetters:function(){var a=this,b=h[a.options.scrollProperty];this._getScrollLeft=function(){return b.getLeft(a.$scrollElement)},this._getScrollTop=function(){return b.getTop(a.$scrollElement)}},_defineSetters:function(){var b=this,c=h[b.options.scrollProperty],d=i[b.options.positionProperty],e=c.setLeft,f=c.setTop;this._setScrollLeft="function"==typeof e?function(a){e(b.$scrollElement,a)}:a.noop,this._setScrollTop="function"==typeof f?function(a){f(b.$scrollElement,a)}:a.noop,this._setPosition=d.setPosition||function(a,c,e,f,g){b.options.horizontalScrolling&&d.setLeft(a,c,e),b.options.verticalScrolling&&d.setTop(a,f,g)}},_handleWindowLoadAndResize:function(){var c=this,d=a(b);c.options.responsive&&d.bind("load."+this.name,function(){c.refresh()}),d.bind("resize."+this.name,function(){c._detectViewport(),c.options.responsive&&c.refresh()})},refresh:function(c){var d=this,e=d._getScrollLeft(),f=d._getScrollTop();c&&c.firstLoad||this._reset(),this._setScrollLeft(0),this._setScrollTop(0),this._setOffsets(),this._findParticles(),this._findBackgrounds(),c&&c.firstLoad&&/WebKit/.test(navigator.userAgent)&&a(b).load(function(){var a=d._getScrollLeft(),b=d._getScrollTop();d._setScrollLeft(a+1),d._setScrollTop(b+1),d._setScrollLeft(a),d._setScrollTop(b)}),this._setScrollLeft(e),this._setScrollTop(f)},_detectViewport:function(){var a=this.$viewportElement.offset(),b=null!==a&&a!==d;this.viewportWidth=this.$viewportElement.width(),this.viewportHeight=this.$viewportElement.height(),this.viewportOffsetTop=b?a.top:0,this.viewportOffsetLeft=b?a.left:0},_findParticles:function(){{var b=this;this._getScrollLeft(),this._getScrollTop()}if(this.particles!==d)for(var c=this.particles.length-1;c>=0;c--)this.particles[c].$element.data("stellar-elementIsActive",d);this.particles=[],this.options.parallaxElements&&this.$element.find("[data-stellar-ratio]").each(function(){var c,e,f,g,h,i,j,k,l,m=a(this),n=0,o=0,p=0,q=0;if(m.data("stellar-elementIsActive")){if(m.data("stellar-elementIsActive")!==this)return}else m.data("stellar-elementIsActive",this);b.options.showElement(m),m.data("stellar-startingLeft")?(m.css("left",m.data("stellar-startingLeft")),m.css("top",m.data("stellar-startingTop"))):(m.data("stellar-startingLeft",m.css("left")),m.data("stellar-startingTop",m.css("top"))),f=m.position().left,g=m.position().top,h="auto"===m.css("margin-left")?0:parseInt(m.css("margin-left"),10),i="auto"===m.css("margin-top")?0:parseInt(m.css("margin-top"),10),k=m.offset().left-h,l=m.offset().top-i,m.parents().each(function(){var b=a(this);return b.data("stellar-offset-parent")===!0?(n=p,o=q,j=b,!1):(p+=b.position().left,void(q+=b.position().top))}),c=m.data("stellar-horizontal-offset")!==d?m.data("stellar-horizontal-offset"):j!==d&&j.data("stellar-horizontal-offset")!==d?j.data("stellar-horizontal-offset"):b.horizontalOffset,e=m.data("stellar-vertical-offset")!==d?m.data("stellar-vertical-offset"):j!==d&&j.data("stellar-vertical-offset")!==d?j.data("stellar-vertical-offset"):b.verticalOffset,b.particles.push({$element:m,$offsetParent:j,isFixed:"fixed"===m.css("position"),horizontalOffset:c,verticalOffset:e,startingPositionLeft:f,startingPositionTop:g,startingOffsetLeft:k,startingOffsetTop:l,parentOffsetLeft:n,parentOffsetTop:o,stellarRatio:m.data("stellar-ratio")!==d?m.data("stellar-ratio"):1,width:m.outerWidth(!0),height:m.outerHeight(!0),isHidden:!1})})},_findBackgrounds:function(){var b,c=this,e=this._getScrollLeft(),f=this._getScrollTop();this.backgrounds=[],this.options.parallaxBackgrounds&&(b=this.$element.find("[data-stellar-background-ratio]"),this.$element.data("stellar-background-ratio")&&(b=b.add(this.$element)),b.each(function(){var b,g,h,i,j,k,l,o=a(this),p=n(o),q=0,r=0,s=0,t=0;if(o.data("stellar-backgroundIsActive")){if(o.data("stellar-backgroundIsActive")!==this)return}else o.data("stellar-backgroundIsActive",this);o.data("stellar-backgroundStartingLeft")?m(o,o.data("stellar-backgroundStartingLeft"),o.data("stellar-backgroundStartingTop")):(o.data("stellar-backgroundStartingLeft",p[0]),o.data("stellar-backgroundStartingTop",p[1])),h="auto"===o.css("margin-left")?0:parseInt(o.css("margin-left"),10),i="auto"===o.css("margin-top")?0:parseInt(o.css("margin-top"),10),j=o.offset().left-h-e,k=o.offset().top-i-f,o.parents().each(function(){var b=a(this);return b.data("stellar-offset-parent")===!0?(q=s,r=t,l=b,!1):(s+=b.position().left,void(t+=b.position().top))}),b=o.data("stellar-horizontal-offset")!==d?o.data("stellar-horizontal-offset"):l!==d&&l.data("stellar-horizontal-offset")!==d?l.data("stellar-horizontal-offset"):c.horizontalOffset,g=o.data("stellar-vertical-offset")!==d?o.data("stellar-vertical-offset"):l!==d&&l.data("stellar-vertical-offset")!==d?l.data("stellar-vertical-offset"):c.verticalOffset,c.backgrounds.push({$element:o,$offsetParent:l,isFixed:"fixed"===o.css("background-attachment"),horizontalOffset:b,verticalOffset:g,startingValueLeft:p[0],startingValueTop:p[1],startingBackgroundPositionLeft:isNaN(parseInt(p[0],10))?0:parseInt(p[0],10),startingBackgroundPositionTop:isNaN(parseInt(p[1],10))?0:parseInt(p[1],10),startingPositionLeft:o.position().left,startingPositionTop:o.position().top,startingOffsetLeft:j,startingOffsetTop:k,parentOffsetLeft:q,parentOffsetTop:r,stellarRatio:o.data("stellar-background-ratio")===d?1:o.data("stellar-background-ratio")})}))},_reset:function(){var a,b,c,d,e;for(e=this.particles.length-1;e>=0;e--)a=this.particles[e],b=a.$element.data("stellar-startingLeft"),c=a.$element.data("stellar-startingTop"),this._setPosition(a.$element,b,b,c,c),this.options.showElement(a.$element),a.$element.data("stellar-startingLeft",null).data("stellar-elementIsActive",null).data("stellar-backgroundIsActive",null);for(e=this.backgrounds.length-1;e>=0;e--)d=this.backgrounds[e],d.$element.data("stellar-backgroundStartingLeft",null).data("stellar-backgroundStartingTop",null),m(d.$element,d.startingValueLeft,d.startingValueTop)},destroy:function(){this._reset(),this.$scrollElement.unbind("resize."+this.name).unbind("scroll."+this.name),this._animationLoop=a.noop,a(b).unbind("load."+this.name).unbind("resize."+this.name)},_setOffsets:function(){var c=this,d=a(b);d.unbind("resize.horizontal-"+this.name).unbind("resize.vertical-"+this.name),"function"==typeof this.options.horizontalOffset?(this.horizontalOffset=this.options.horizontalOffset(),d.bind("resize.horizontal-"+this.name,function(){c.horizontalOffset=c.options.horizontalOffset()})):this.horizontalOffset=this.options.horizontalOffset,"function"==typeof this.options.verticalOffset?(this.verticalOffset=this.options.verticalOffset(),d.bind("resize.vertical-"+this.name,function(){c.verticalOffset=c.options.verticalOffset()})):this.verticalOffset=this.options.verticalOffset},_repositionElements:function(){var a,b,c,d,e,f,g,h,i,j,k=this._getScrollLeft(),l=this._getScrollTop(),n=!0,o=!0;if(this.currentScrollLeft!==k||this.currentScrollTop!==l||this.currentWidth!==this.viewportWidth||this.currentHeight!==this.viewportHeight){for(this.currentScrollLeft=k,this.currentScrollTop=l,this.currentWidth=this.viewportWidth,this.currentHeight=this.viewportHeight,j=this.particles.length-1;j>=0;j--)a=this.particles[j],b=a.isFixed?1:0,this.options.horizontalScrolling?(f=(k+a.horizontalOffset+this.viewportOffsetLeft+a.startingPositionLeft-a.startingOffsetLeft+a.parentOffsetLeft)*-(a.stellarRatio+b-1)+a.startingPositionLeft,h=f-a.startingPositionLeft+a.startingOffsetLeft):(f=a.startingPositionLeft,h=a.startingOffsetLeft),this.options.verticalScrolling?(g=(l+a.verticalOffset+this.viewportOffsetTop+a.startingPositionTop-a.startingOffsetTop+a.parentOffsetTop)*-(a.stellarRatio+b-1)+a.startingPositionTop,i=g-a.startingPositionTop+a.startingOffsetTop):(g=a.startingPositionTop,i=a.startingOffsetTop),this.options.hideDistantElements&&(o=!this.options.horizontalScrolling||h+a.width>(a.isFixed?0:k)&&h<(a.isFixed?0:k)+this.viewportWidth+this.viewportOffsetLeft,n=!this.options.verticalScrolling||i+a.height>(a.isFixed?0:l)&&i<(a.isFixed?0:l)+this.viewportHeight+this.viewportOffsetTop),o&&n?(a.isHidden&&(this.options.showElement(a.$element),a.isHidden=!1),this._setPosition(a.$element,f,a.startingPositionLeft,g,a.startingPositionTop)):a.isHidden||(this.options.hideElement(a.$element),a.isHidden=!0);for(j=this.backgrounds.length-1;j>=0;j--)c=this.backgrounds[j],b=c.isFixed?0:1,d=this.options.horizontalScrolling?(k+c.horizontalOffset-this.viewportOffsetLeft-c.startingOffsetLeft+c.parentOffsetLeft-c.startingBackgroundPositionLeft)*(b-c.stellarRatio)+"px":c.startingValueLeft,e=this.options.verticalScrolling?(l+c.verticalOffset-this.viewportOffsetTop-c.startingOffsetTop+c.parentOffsetTop-c.startingBackgroundPositionTop)*(b-c.stellarRatio)+"px":c.startingValueTop,m(c.$element,d,e)}},_handleScrollEvent:function(){var a=this,b=!1,c=function(){a._repositionElements(),b=!1},d=function(){b||(o(c),b=!0)};this.$scrollElement.bind("scroll."+this.name,d),d()},_startAnimationLoop:function(){var a=this;this._animationLoop=function(){o(a._animationLoop),a._repositionElements()},this._animationLoop()}},a.fn[f]=function(b){var c=arguments;return b===d||"object"==typeof b?this.each(function(){a.data(this,"plugin_"+f)||a.data(this,"plugin_"+f,new e(this,b))}):"string"==typeof b&&"_"!==b[0]&&"init"!==b?this.each(function(){var d=a.data(this,"plugin_"+f);d instanceof e&&"function"==typeof d[b]&&d[b].apply(d,Array.prototype.slice.call(c,1)),"destroy"===b&&a.data(this,"plugin_"+f,null)}):void 0},a[f]=function(){var c=a(b);return c.stellar.apply(c,Array.prototype.slice.call(arguments,0))},a[f].scrollProperty=h,a[f].positionProperty=i,b.Stellar=e}(jQuery,this,document);


/*=======================================
   Parallax Image move
=======================================*/ 
var scene = document.getElementById('scene');
var parallax = new Parallax(scene);

/*=======================================
   Parallax bg 
=======================================*/ 
$(document).ready(function(){
	$.stellar({
		horizontalScrolling: false,
	});
});
