'use strict';

var path = require('path');

module.exports = function (fn) {
  var lazy = require('lazy-cache')(fn);
  var utils = lazy;

  lazy('for-own');
  lazy('is-valid-glob');
  lazy('has-glob');
  lazy('globby');
  lazy('forward-object', 'forward');
  lazy('mixin-deep', 'merge');
  lazy('extend-shallow', 'extend');
  lazy('delegate-properties', 'delegate');
  lazy('engine-cache', 'Engines');
  lazy('helper-cache', 'Helpers');
  lazy('inflection', 'inflect');
  lazy('layouts');

  /**
   * Default router methods used in all Template instances
   */

  utils.methods = [
    'onLoad',
    'preCompile',
    'preLayout',
    'onLayout',
    'postLayout',
    'onMerge',
    'postCompile',
    'preRender',
    'postRender'
  ];

  /**
   * Resolve the absolute file paths for a glob of files.
   */

  utils.resolveGlob = function resolveGlob(patterns, options) {
    var opts = utils.extend({cwd: process.cwd()}, options);
    return utils.globby.sync(patterns, opts).map(function (fp) {
      return path.resolve(opts.cwd, fp);
    });
  };

  /**
   * Require a glob of files
   */

  utils.requireGlob = function requireGlob(patterns, options) {
    return utils.resolveGlob(patterns, options).reduce(function (acc, fp) {
      if (/\.(js(?:on)?)/.test(fp)) {
        acc[utils.rename(fp, options)] = utils.tryRequire(fp);
      }
      return acc;
    }, {});
  };

  /**
   * Rename a file
   */

  utils.rename = function rename(fp, options) {
    var opts = utils.extend({renameFn: name}, options);
    return opts.renameFn(fp);
  };

  /**
   * Singularize the given `name`
   */

  utils.single = function single(name) {
    return utils.inflect.singularize(name);
  };

  /**
   * Pluralize the given `name`
   */

  utils.plural = function plural(name) {
    return utils.inflect.pluralize(name);
  };

  /**
   * Arrayify the given value by casting it to an array.
   */

  utils.arrayify = function arrayify(val) {
    return val ? (Array.isArray(val) ? val : [val]) : [];
  };

  /**
   * Return true if the given value is an object.
   */

  utils.isObject = function isObject(val) {
    return val && (typeof val === 'function' || typeof val === 'object')
      && !Array.isArray(val);
  };

  /**
   * Ensure file extensions are formatted properly for lookups.
   *
   * ```js
   * utils.formatExt('hbs');
   * //=> '.hbs'
   *
   * utils.formatExt('.hbs');
   * //=> '.hbs'
   * ```
   *
   * @param {String} `ext` File extension
   * @return {String}
   * @api public
   */

  utils.formatExt = function formatExt(ext) {
    if (typeof ext !== 'string') {
      throw new Error('utils.formatExt() expects `ext` to be a string.');
    }
    if (ext.charAt(0) !== '.') {
      return '.' + ext;
    }
    return ext;
  };

  /**
   * Strip the dot from a file extension
   *
   * ```js
   * utils.stripDot('.hbs');
   * //=> 'hbs'
   * ```
   *
   * @param {String} `ext` extension
   * @return {String}
   * @api public
   */

  utils.stripDot = function stripDot(ext) {
    if (typeof ext !== 'string') {
      throw new Error('utils.stripDot() expects `ext` to be a string.');
    }
    if (ext.charAt(0) === '.') {
      return ext.slice(1);
    }
    return ext;
  };

  /**
   * Noop
   */

  utils.noop = function noop() {
    return;
  };

  /**
   * Returns the first argument passed to the function.
   */

  utils.identity = function identity(val) {
    return val;
  };

  /**
   * Attempt to require a file. Fail silently.
   */

  utils.tryRequire = function tryRequire(fp) {
    try {
      return require(path.resolve(fp));
    } catch(err) {};
    return null;
  };

  /**
   * Format an error object.
   */

  utils.error = function error(msg, val) {
    throw new Error(msg + JSON.stringify(val));
  };

  /**
   * Bind a `thisArg` to all the functions on the target
   *
   * @param  {Object|Array} `target` Object or Array with functions as values that will be bound.
   * @param  {Object} `thisArg` Object to bind to the functions
   * @return {Object|Array} Object or Array with bound functions.
   */

  utils.bindAll = function bindAll(target, thisArg) {
    if (Array.isArray(target)) {
      return utils.bindEach(target, thisArg);
    }
    return utils.reduce(target, function (acc, fn, key) {
      if (typeof fn === 'object' && typeof fn !== 'function') {
        acc[key] = utils.bindAll(fn, thisArg);
      } else {
        acc[key] = fn.bind(thisArg);
        if (fn.async) {
          acc[key].async = fn.async;
        }
      }
      return acc;
    }, {});
  };

  /**
   * Bind a `thisArg` to all elements with object properties
   * that have function values
   */

  utils.bindEach = function bindEach(target, thisArg) {
    for (var i = 0; i < target.length; i++) {
      if (typeof target[i] === 'function') {
        target[i] = target[i].bind(thisArg);
      } else {
        target[i] = utils.bindAll(target[i], thisArg);
      }
    }
    return target;
  };

  return utils;
};



/**
 * Get the basename from a filepath, excluding extension.
 */

function name(fp) {
  return path.basename(fp, path.extname(fp));
}
