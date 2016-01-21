'use strict';

var utils = require('../utils');

/**
 * Add a `renameKey` function to the given `app` instance.
 */

module.exports = function() {
  return function(app) {
    app.define('renameKey', function renameKey(key, view, fn) {
      if (typeof view === 'function') {
        return renameKey.call(this, key, { path: key }, view);
      }
      if (typeof key === 'function') {
        return renameKey.call(this, null, null, key);
      }
      if (typeof fn !== 'function') {
        fn = this.option('renameKey');
      }
      if (typeof fn !== 'function') {
        fn = utils.identity;
      }

      this.options.renameKey = fn;
      if (typeof key === 'string') {
        return fn.call(this, key, view);
      }
      return this;
    }.bind(app));
  };
};
