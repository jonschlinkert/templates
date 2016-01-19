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
 * Bind a `thisArg` to all the functions on the target
 *
 * @param  {Object|Array} `target` Object or Array with functions as values that will be bound.
 * @param  {Object} `thisArg` Object to bind to the functions
 * @return {Object|Array} Object or Array with bound functions.
 */

utils.bindAll = function(target, thisArg) {
  for (var key in target) {
    var fn = target[key];
    if (typeof fn === 'object') {
      target[key] = utils.bindAll(fn, thisArg);
    } else {
      target[key] = fn.bind(thisArg);
      // get `async` flag or any other helper options on `fn`
      for (var k in fn) target[key][k] = fn[k];
    }
  }
  return target;
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
