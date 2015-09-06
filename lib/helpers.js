'use strict';

var Base = require('base-methods');
var utils = require('./utils')(require);

function Helpers(options) {
  Base.call(this, options);
  this.options = options || {};
  this.async = new utils.Helpers({bind: false});
  this.sync = new utils.Helpers({bind: false});
}

Base.extend(Helpers, {
  constructor: Helpers,

  /**
   * Register a template helper.
   *
   * @param {String} `key` Helper name
   * @param {Function} `fn` Helper function.
   * @api public
   */

  helper: function(name, fn) {
    if (typeof name === 'string' && arguments.length === 1) {
      return this.sync.getHelper(name);
    }
    if (typeof fn !== 'function') {
      throw new TypeError('expected helper fn to be a function.');
    }
    this.sync.addHelper(name, fn);
    return this;
  },

  /**
   * Get or set an async helper. If only the name is passed, the
   * helper is returned.
   *
   * @param {String} `name` Helper name.
   * @param {Function} `fn` Helper function
   * @api public
   */

  asyncHelper: function(name, fn) {
    if (typeof name === 'string' && arguments.length === 1) {
      return this.async.getHelper(name);
    }
    if (typeof fn !== 'function') {
      throw new TypeError('expected helper fn to be a function.');
    }
    this.async.addAsyncHelper(name, fn);
    return this;
  },

  /**
   * Register multiple template helpers.
   *
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  helpers: function(helpers, options) {
    if (helpers && utils.isValidGlob(helpers) && utils.hasGlob(helpers)) {
      helpers = utils.requireGlob(helpers, options || {});
      if (!helpers) return this;

      for (var name in helpers) {
        if (helpers.hasOwnProperty(name)) {
          var val = helpers[name];
          if (typeof val === 'function') {
            this.helper(name, val);
          } else if (typeof val === 'object') {
            this.helpers(val);
          }
        }
      }
      return this;
    }

    if (!utils.isObject(helpers)) {
      throw new TypeError('expected helpers to be an object.');
    }
    this.visit('helper', helpers);
    return this;
  },

  /**
   * Register multiple async template helpers.
   *
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  asyncHelpers: function(helpers, options) {
    if (helpers && utils.isValidGlob(helpers) && utils.hasGlob(helpers)) {
      helpers = utils.requireGlob(helpers, options || {});
      if (!helpers) return this;

      for (var name in helpers) {
        if (helpers.hasOwnProperty(name)) {
          var val = helpers[name];
          if (typeof val === 'function') {
            this.asyncHelper(name, val);
          } else if (typeof val === 'object') {
            this.asyncHelpers(val);
          }
        }
      }
      return this;
    }

    if (!utils.isObject(helpers)) {
      throw new TypeError('expected helpers to be an object.');
    }
    this.visit('asyncHelper', helpers);
    return this;
  }
});

/**
 * Expose `Helpers`
 */

module.exports = Helpers;
