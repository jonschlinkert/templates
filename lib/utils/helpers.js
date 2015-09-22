'use strict';

/**
 * Expose helper utils
 */

var utils = module.exports;

/**
 * Bind a `thisArg` to all the functions on the target
 *
 * @param  {Object|Array} `target` Object or Array with functions as values that will be bound.
 * @param  {Object} `thisArg` Object to bind to the functions
 * @return {Object|Array} Object or Array with bound functions.
 */

utils.bindAll = function bindAll(target, thisArg) {
  for (var key in target) {
    var fn = target[key];
    if (typeof fn === 'object') {
      target[key] = utils.bindAll(fn, thisArg);
    } else if (typeof fn === 'function') {
      target[key] = fn.bind(thisArg);
      // get `async` flag or any other helper options on `fn`
      for (var k in fn) target[key][k] = fn[k];
    }
  }
  return target;
};
