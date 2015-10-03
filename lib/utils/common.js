'use strict';

var fs = require('fs');
var keys = require('./keys');

/**
 * Expose common utils
 */

var utils = module.exports;

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
 * Arrayify the given value by casting it to an array.
 */

utils.arrayify = function(val) {
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
 * Try to read a file, fail gracefully
 */

utils.tryRead = function(fp) {
  try {
    return fs.readFileSync(fp);
  } catch(err) {}
  return null;
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
      if (obj.hasOwnProperty(key)) {
        target[key] = target[key] || obj[key];
      }
    }
  }
  return target;
};
