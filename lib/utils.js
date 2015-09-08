'use strict';

var path = require('path');

/**
 * Lazily required module dependencies
 */

var lazy = require('lazy-cache')(require);

// object utils
lazy('clone');
lazy('define-property', 'define');
lazy('forward-object', 'forward');
lazy('mixin-deep', 'merge');
lazy('extend-shallow', 'extend');
lazy('object.reduce', 'reduce');

// routing
lazy('en-route', 'router');

// engines, templates and helpers
lazy('engine-base', 'engine');
lazy('engine-cache', 'Engines');
lazy('helper-cache', 'Helpers');
lazy('inflection', 'inflect');
lazy('layouts');

// glob/matching utils
lazy('globby');
lazy('micromatch', 'mm');
lazy('is-valid-glob');
lazy('has-glob');

/**
 * Utils
 */

var utils = lazy;

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

utils.copy = function copy(receiver, provider, key) {
  var val = utils.getDescriptor(provider, key);
  if (val) utils.define(receiver, key, val);
};

utils.getDescriptor = function getDescriptor(provider, key) {
  return Object.getOwnPropertyDescriptor(provider, key);
};

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
 * Return the given value as-is.
 */

utils.identity = function identity(val) {
  return val;
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
 * Return true if the given value is a view.
 */

utils.isView = function isView(val) {
  return val && val.hasOwnProperty('content')
    || val.hasOwnProperty('contents')
    || val.hasOwnProperty('path');
};

/**
 * Return true if the given value is a view.
 */

utils.hasView = function hasView(val) {
  var keys = Object.keys(val);
  if (keys.length > 1) return false;
  return utils.isView(val[keys[0]]);
};

/**
 * Return true if the given value is a view.
 */

utils.renameKey = function(app) {
  app.renameKey = function renameKey(key, fn) {
    if (typeof key === 'function') {
      fn = key;
      key = null;
    }

    if (typeof fn !== 'function') {
      fn = this.option('renameKey');
    }
    if (typeof fn !== 'function') {
      fn = utils.identity;
    }

    this.options.renameKey = fn;
    if (typeof key === 'string') {
      return fn(key);
    }
    return fn;
  }.bind(app);
};

/**
 * Set or get an option value. This is a factory for
 * adding an `option` method to a class
 */

utils.option = function(app) {
  app.option = function(key, value) {
    if (typeof key === 'string') {
      if (arguments.length === 1) {
        return this.get('options.' + key);
      }
      this.set('options.' + key, value);
      this.emit('option', key, value);
      return this;
    }
    if (typeof key !== 'object') {
      throw new TypeError('expected a string or object.');
    }
    this.visit('option', key);
    return this;
  }.bind(app);
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
 * Attempt to require a file. Fail silently.
 */

utils.tryRequire = function tryRequire(fp) {
  try {
    return require(path.resolve(fp));
  } catch(err) {}
  return null;
};

/**
 * Format an error object.
 */

utils.error = function error(msg, val) {
  return new Error(msg + JSON.stringify(val));
};

/**
 * Bind a `thisArg` to all the functions on the target
 *
 * @param  {Object|Array} `target` Object or Array with functions as values that will be bound.
 * @param  {Object} `thisArg` Object to bind to the functions
 * @return {Object|Array} Object or Array with bound functions.
 */

utils.bindAll = function bindAll(target, thisArg) {
  return utils.reduce(target, function (acc, fn, key) {
    if (typeof fn === 'object') {
      acc[key] = utils.bindAll(fn, thisArg);
    } else if (typeof fn === 'function') {
      acc[key] = fn.bind(thisArg);
      if (fn.async) acc[key].async = fn.async;
    }
    return acc;
  }, {});
};

/**
 * Return the first object with a key that matches
 * the given glob pattern.
 *
 * @param {Object} `object`
 * @param {String|Array} `patterns`
 * @param {Object} `options`
 * @return {Object}
 */

utils.matchKey = function matchKey(obj, patterns, options) {
  if (!utils.isObject(obj)) return null;
  var keys = utils.mm(Object.keys(obj), patterns, options);
  return obj[keys[0]];
};

/**
 * Return all objects with keys that match
 * the given glob pattern.
 *
 * @param {Object} `object`
 * @param {String|Array} `patterns`
 * @param {Object} `options`
 * @return {Object}
 */

utils.matchKeys = function matchKeys(obj, patterns, options) {
  var keys = utils.mm(Object.keys(obj), patterns, options).sort();
  var len = keys.length, i = 0;
  var res = {};

  while (len--) {
    var key = keys[i++];
    res[key] = obj[key];
  }
  return res;
};


/**
 * Get the basename from a filepath, excluding extension.
 */

function name(fp) {
  return path.basename(fp, path.extname(fp));
}

module.exports = lazy;
