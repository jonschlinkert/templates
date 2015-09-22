'use strict';

var common = require('export-files')(__dirname);
var utils = require('./lazy');
var seen = {};

for (var key in common) {
  if (key === 'lazy') continue;

  if (common.hasOwnProperty(key)) {
    var val = common[key];

    for (var prop in val) {
      if (val.hasOwnProperty(prop)) {
        if (!seen.hasOwnProperty(prop)) {
          seen[prop] = true;
        } else {
          throw new Error('duplicate util: ' + prop);
        }
        utils[prop] = val[prop];
      }
    }
  }
}

/**
 * Expose utils
 */

module.exports = utils;
