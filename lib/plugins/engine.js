'use strict';

var debug = require('debug')('base:templates:engine');
var utils = require('../utils');

/**
 * Expose engine utils
 */

module.exports = function(proto) {

  /**
   * Register a view engine callback `fn` as `ext`.
   *
   * ```js
   * app.engine('hbs', require('engine-handlebars'));
   *
   * // using consolidate.js
   * var engine = require('consolidate');
   * app.engine('jade', engine.jade);
   * app.engine('swig', engine.swig);
   *
   * // get a registered engine
   * var swig = app.engine('swig');
   * ```
   * @name .engine
   * @param {String|Array} `exts` String or array of file extensions.
   * @param {Function|Object} `fn` or `settings`
   * @param {Object} `settings` Optionally pass engine options as the last argument.
   * @api public
   */

  proto.engine = function(exts, fn, settings) {
    if (arguments.length === 1 && typeof exts === 'string') {
      return this.getEngine(exts);
    }
    if (!Array.isArray(exts) && typeof exts !== 'string') {
      throw new TypeError('expected engine ext to be a string or array.');
    }
    if (utils.isObject(fn) && typeof settings === 'function') {
      var tmp = fn;
      settings = fn;
      fn = tmp;
    }
    utils.arrayify(exts).forEach(function(ext) {
      this.setEngine(ext, fn, settings);
    }.bind(this));
    return this;
  };

  /**
   * Register engine `ext` with the given render `fn` and/or `settings`.
   *
   * ```js
   * app.setEngine('hbs', require('engine-handlebars'), {
   *   delims: ['<%', '%>']
   * });
   * ```
   * @param {String} `ext` The engine to set.
   */

  proto.setEngine = function(ext, fn, settings) {
    debug('registering engine "%s"', ext);
    ext = utils.formatExt(ext);
    settings = settings || {};
    if (settings.default === true) {
      this._.engines.defaultEngine = ext;
    }
    this._.engines.setEngine(ext, fn, settings);
    return this;
  };

  /**
   * Get registered engine `ext`.
   *
   * ```js
   * app.engine('hbs', require('engine-handlebars'));
   * var engine = app.getEngine('hbs');
   * ```
   * @param {String} `ext` The engine to get.
   * @api public
   */

  proto.getEngine = function(ext) {
    debug('getting engine "%s"', ext);

    if (!utils.isString(ext)) {
      ext = this.option('view engine')
        || this.option('viewEngine')
        || this.option('engine');
    }

    if (utils.isString(ext)) {
      ext = utils.formatExt(ext);
      return this._.engines.getEngine(ext);
    }
  };
};
