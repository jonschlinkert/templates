'use strict';

var common = require('./common');
var lazy = require('./lazy');

/**
 * Expose naming utils
 */

var utils = module.exports;

/**
 * Singularize the given `name`
 */

utils.single = function single(name) {
  return lazy.inflect.singularize(name);
};

/**
 * Pluralize the given `name`
 */

utils.plural = function plural(name) {
  return lazy.inflect.pluralize(name);
};

/**
 * Rename a file
 */

utils.rename = function rename(fp, opts) {
  opts = opts || {};
  var renameFn = opts.renameFn || opts.rename || common.identity;
  return renameFn(fp);
};

/**
 * Return true if the given value is a view.
 */

utils.renameKey = function(app) {
  lazy.define(app, 'renameKey', function renameKey(key, fn) {
    if (typeof key === 'function') {
      fn = key;
      key = null;
    }

    if (this.option && typeof fn !== 'function') {
      fn = this.option('renameKey');
    }
    if (typeof fn !== 'function') {
      fn = common.identity;
    }

    this.options = this.options || {};
    this.options.renameKey = fn;
    if (typeof key === 'string') {
      return fn.call(this, key);
    }
    return fn;
  }.bind(app));
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
 * Expose utils
 */

module.exports = utils;
