'use strict';

var utils = require('../utils');

/**
 * Add a `renameKey` function to the given `app` instance.
 */

module.exports = function (defaults) {
  return function(app) {
    app.define('renameKey', function renameKey(key, fn) {
      if (typeof key === 'function') {
        fn = key;
        key = null;
      }
      if (typeof fn !== 'function') {
        fn = this.option('renameKey') || utils.identity;
      }
      this.options.renameKey = fn;
      if (typeof key === 'string') {
        return fn.call(this, key);
      }
      return fn;
    }.bind(app));
  };
};
