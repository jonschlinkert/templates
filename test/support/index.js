'use strict';

var path = require('path');
var findPkg = require('find-pkg');
var assert = require('assert');
var ignore = require('./ignore');
var cache = {};

exports.hasProperties = function(obj, keys) {
  keys = Array.isArray(keys) ? keys : [keys];
  var len = keys.length;
  var idx = -1;
  while (++idx < len) {
    assert(obj.hasOwnProperty(keys[idx]));
  }
};

exports.doesNotHaveProperties = function(obj, keys) {
  keys = Array.isArray(keys) ? keys : [keys];
  var len = keys.length;
  var idx = -1;
  while (++idx < len) {
    assert(!obj.hasOwnProperty(keys[idx]));
  }
};

exports.containEql = function containEql(actual, expected) {
  if (Array.isArray(expected)) {
    var len = expected.length;
    while (len--) {
      exports.containEql(actual[len], expected[len]);
    }
  } else {
    for (var key in expected) {
      assert.deepEqual(actual[key], expected[key]);
    }
  }
};

exports.keys = function keys(obj) {
  var arr = [];
  for (var key in obj) {
    if (ignore.indexOf(key) === -1) {
      arr.push(key);
    }
  }
  return arr;
};

/**
 * Return true if the given value is a buffer
 */

exports.isBuffer = function (val) {
  if (val && val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
};

exports.resolve = function(filepath) {
  filepath = filepath || '';
  var key = 'app:' + filepath;
  if (cache.hasOwnProperty(key)) {
    return cache[key];
  }

  var pkg = findPkg.sync(process.cwd());
  var prefix = pkg.name !== 'templates'
    ? 'templates'
    : '';

  var base = filepath
    ? path.join(prefix, filepath)
    : process.cwd();

  var fp = tryResolve(base);

  if (typeof fp === 'undefined') {
    throw new Error('cannot resolve: ' + fp);
  }
  return (cache[key] = require(fp));
};

function tryResolve(name) {
  try {
    return require.resolve(name);
  } catch(err) {}

  try {
    return require.resolve(path.resolve(name));
  } catch(err) {}
}
