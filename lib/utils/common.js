'use strict';

var keys = require('./keys');

/**
 * Expose common utils
 */

var utils = module.exports;

/**
 * Return true if a template is a partial
 */

utils.isPartial = function(view) {
  if (!view.hasOwnProperty('options')) {
    throw new Error('view is expected to have an "options" object');
  }
  if (!view.options.hasOwnProperty('viewType')) {
    throw new Error('view.options is expected to have a viewType property');
  }
  return view.isType('partial');
};

/**
 * Return true if a template is renderable, and not a partial or layout
 */

utils.isRenderable = function(view) {
  if (!view || typeof view.isType !== 'function') {
    return false;
  }
  return view.isType('renderable')
    && !view.isType('partial')
    && !view.isType('layout');
};

/**
 * When a constructor is defined after init, update any underlying
 * properties that may rely on that option (constructor).
 */

utils.updateOptions = function(app, key, value) {
  var k = keys.constructorKeys;
  if (k.indexOf(key) > -1) {
    app.define(key, value);
  }
};

/**
 * Return the given value as-is.
 */

utils.identity = function(val) {
  return val;
};

/**
 * Return true if the given value is a buffer
 */

utils.isBuffer = function(val) {
  if (val && val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
};

/**
 * Arrayify the given value by casting it to an array.
 */

utils.arrayify = function(val) {
  if (typeof val === 'undefined' || val === null || val === '') {
    return [];
  }
  return Array.isArray(val) ? val : [val];
};

/**
 * Return the last element in an array or array-like object.
 */

utils.last = function(array, n) {
  return array[array.length - (n || 1)];
};

/**
 * Return true if the given value is an object.
 * @return {Boolean}
 */

utils.isObject = function(val) {
  if (!val || Array.isArray(val)) {
    return false;
  }
  return typeof val === 'function'
    || typeof val === 'object';
};

/**
 * Return true if the given value is a stream.
 */

utils.isStream = function(val) {
  return utils.isObject(val)
    && (typeof val.pipe === 'function')
    && (typeof val.on === 'function');
};

/**
 * Assign own properties from provider to receiver, but only
 * if the receiving object does not already have a value.
 */

utils.defaults = function(target) {
  var args = [].slice.call(arguments, 1);
  var len = args.length;
  var i = -1;

  while (++i < len) {
    var obj = args[i];

    for (var key in obj) {
      target[key] = target[key] || obj[key];
    }
  }
  return target;
};
