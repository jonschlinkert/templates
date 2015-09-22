'use strict';

var assert = require('assert');
var ignore = require('./ignore');

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