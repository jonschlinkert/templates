'use strict';

/**
 * Expose common utils
 */

var utils = module.exports;

/**
 * No-op, do nothing
 */

utils.noop = function noop() {};

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
  return Array.isArray(val) ? val : [val];
};

/**
 * Return true if the given value is an object.
 * @return {Boolean}
 */

utils.isObject = function isObject(val) {
  if (!val || Array.isArray(val)) {
    return false;
  }
  return typeof val === 'function'
    || typeof val === 'object';
};

/**
 * Return true if the given value is a stream.
 */

utils.isStream = function isStream(val) {
  return utils.isObject(val)
    && (typeof val.pipe === 'function')
    && (typeof val.on === 'function');
};

/**
 * Assign own properties from provider to receiver, but only
 * if the receiving object does not already have a value.
 */

utils.defaults = function defaults(target) {
  target = target || {};

  var args = [].slice.call(arguments, 1);
  var len = args.length;
  var i = -1;

  while (++i < len) {
    var obj = args[i];

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        target[key] = target[key] || obj[key];
      }
    }
  }
  return target;
};

/**
 * Format an error object.
 */

utils.error = function error(msg, val) {
  return new Error(msg + JSON.stringify(val));
};

/**
 * Returns true if an array has the given element, or an
 * object has the given key.
 *
 * @return {Boolean}
 */

utils.has = function has(val, key) {
  if (Array.isArray(val)) {
    return val.indexOf(key) > -1;
  }
  return val.hasOwnProperty(key);
};

/**
 * Returns true if an array or object has any of the given keys.
 * @return {Boolean}
 */

utils.hasAny = function hasAny(val, keys) {
  keys = utils.arrayify(keys);
  var len = keys.length;
  while (len--) {
    if (utils.has(val, keys[len])) {
      return true;
    }
  }
  return false;
};

/**
 * Handle when an option has been updated by updating any underlying properties
 * that may rely on those options
 */

utils.optionUpdated = function optionUpdated(app, key, value) {
  var keys = require('./keys').constructorKeys;
  if (keys.indexOf(key) > -1) {
    app.define(key, value);
  }
};
