'use strict';

var common = require('./common');
var lazy = require('./lazy');

/**
 * Lookup/matching utils
 */

var utils = module.exports;

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
  if (!common.isObject(obj)) return null;

  if (typeof patterns === 'string' && obj.hasOwnProperty(patterns)) {
    return obj[patterns];
  }

  var isMatch = lazy.mm.matcher(patterns, options);
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (isMatch(key)) {
        return obj[key];
      }
    }
  }
  return null;
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
  var keys = lazy.mm(Object.keys(obj), patterns, options);
  var len = keys.length, i = 0;
  var res = {};

  while (len--) {
    var key = keys[i++];
    res[key] = obj[key];
  }
  return res;
};
