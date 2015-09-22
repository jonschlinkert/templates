'use strict';

var utils = require('../utils');

/**
 * Expose engine utils
 */

module.exports = function (proto) {

  /**
   * Prime `engines` objects
   */

  init(proto);

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
    utils.arrayify(exts).forEach(function (ext) {
      this.setEngine(ext, fn, settings);
    }.bind(this));
    return this;
  };

  /**
   * Register an engine for `ext` with the given `settings`
   *
   * @param {String} `ext` The engine to get.
   */

  proto.setEngine = function(ext, fn, settings) {
    ext = utils.formatExt(ext);
    this._.engines.setEngine(ext, fn, settings);
    return this;
  };

  /**
   * Get the engine settings registered for the given `ext`.
   *
   * @param {String} `ext` The engine to get.
   */

  proto.getEngine = function(ext) {
    ext = ext ? utils.formatExt(ext) : null;

    var engine = this._.engines.getEngine(ext);
    if (engine) return engine;

    ext = this.option('view engine');
    return this._.engines.getEngine(ext);
  };


  proto.defaultEngine = function (ext) {
    var engine = this.getEngine(ext);
    if (typeof engine === 'undefined') {
      throw new Error('defaultEngine expects "ext" to be a registered engine.');
    }
    this._.engines.options.defaultEngine = engine;
    return this;
  };
};

/**
 * Adds the `engines` object to `app._`, then:
 *
 * @param {Object} `app` Instance of templates
 */

function init(proto) {
  if (!proto._) {
    proto.define('_', {});
  }

  proto.engines = {};
  proto._.engines = new utils.Engines(proto.engines);
}
