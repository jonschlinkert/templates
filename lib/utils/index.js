'use strict';

var common = require('export-files')(__dirname);
var utils = require('./lazy');

for (var key in common) {
  if (key === 'lazy') continue;
  var val = common[key];

  for (var prop in val) {
    utils[prop] = val[prop];
  }
}

/**
 * Expose utils
 */

module.exports = utils;
