'use strict';

var utils = require('../utils');

/**
 * Add a `renameKey` function to the given `app` instance.
 */

module.exports = function() {
  return function(app) {
    app.define('renameKey', function renameKey(key, view, fn) {
      if (typeof view === 'function') {
        fn = view;
        view = { path: key };
      }
      if (typeof key === 'function') {
        fn = key;
        key = null;
      }
      if (typeof fn !== 'function') {
        fn = this.option('renameKey') || utils.identity;
      }

      this.options.renameKey = function(key, view) {
        return fn(key, view);
      };

      if (typeof key === 'string') {
        return fn.call(this, key, view);
      }
      return this;
    }.bind(app));
  };
};
