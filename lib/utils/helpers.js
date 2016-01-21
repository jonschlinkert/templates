'use strict';

var common = require('./common');

/**
 * Expose helper utils
 */

var utils = module.exports;

/**
 * Return true if the given value is an object.
 * @return {Boolean}
 */

utils.isOptions = function(val) {
  return common.isObject(val) && val.hasOwnProperty('hash');
};

/**
 * Format a helper error.
 * TODO: create an error class for helpers
 */

utils.helperError = function(app, helperName, viewName, cb) {
  var err = new Error('helper "' + helperName + '" cannot find "' + viewName + '"');
  app.emit('error', err);
  if (typeof cb === 'function') {
    return cb(err);
  } else {
    throw err;
  }
};
