'use strict';

var lazy = require('./lazy');

/**
 * Expose naming utils
 */

var utils = module.exports;

/**
 * Convenience method for setting `this.isFoo` and `this._name = 'Foo'
 * on the given `app`
 */

utils.isName = function isName(app, name, force) {
  if (!app._name || force === true) {
    lazy.define(app, 'is' + name, true);
    lazy.define(app, '_name', name);
  }
};

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
 * Expose utils
 */

module.exports = utils;
