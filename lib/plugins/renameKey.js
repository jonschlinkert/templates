'use strict';

var utils = require('../utils');

/**
 * Add a `renameKey` function to the given `app` instance.
 */

module.exports = function() {
  return function(app) {
    this.define('renameKey', renameKey);

    function renameKey(key, file, fn) {
      if (typeof key === 'function') {
        fn = key;
        key = null;
        file = null;
      }
      if (typeof file === 'function') {
        fn = file;
        file = null;
      }
      if (typeof fn !== 'function') {
        fn = app.option('renameKey') || utils.identity;
      }
      app.options.renameKey = fn;
      if (typeof key === 'string') {
        return fn(key, file);
      }
      return app;
    }
  };
};
