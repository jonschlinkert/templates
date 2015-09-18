'use strict';

var utils = require('./utils');

module.exports = function initHelpers(app) {
  init(app);

  var async = app._.helpers.async;
  var sync = app._.helpers.sync;

  app.visit('mixin', {

    /**
     * Register a template helper.
     *
     * ```js
     * app.helper('upper', function(str) {
     *   return str.toUpperCase();
     * });
     * ```
     * @name .helper
     * @param {String} `name` Helper name
     * @param {Function} `fn` Helper function.
     * @api public
     */

    helper: function() {
      this.helpers.apply(this, arguments);
      return this;
    },

    /**
     * Register multiple template helpers.
     *
     * ```js
     * app.helpers({
     *   foo: function() {},
     *   bar: function() {},
     *   baz: function() {}
     * });
     * ```
     * @name .helpers
     * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
     * @api public
     */

    helpers: function() {
      var cache = {};
      var loader = utils.loader(cache);
      loader.apply(loader, arguments);
      for (var key in cache) {
        sync.addHelper(key, cache[key]);
      }
      return this;
    },

    /**
     * Get or set an async helper. If only the name is passed, the
     * helper is returned.
     *
     * ```js
     * app.asyncHelper('upper', function(str, next) {
     *   next(null, str.toUpperCase());
     * });
     * ```
     * @name .asyncHelper
     * @param {String} `name` Helper name.
     * @param {Function} `fn` Helper function
     * @api public
     */

    asyncHelper: function() {
      this.asyncHelpers.apply(this, arguments);
      return this;
    },

    /**
     * Register multiple async template helpers.
     *
     * ```js
     * app.asyncHelpers({
     *   foo: function() {},
     *   bar: function() {},
     *   baz: function() {}
     * });
     * ```
     * @name .asyncHelper
     * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
     * @api public
     */

    asyncHelpers: function() {
      var cache = {};
      var loader = utils.loader(cache);
      loader.apply(loader, arguments);
      for (var key in cache) {
        async.addAsyncHelper(key, cache[key]);
      }
      return this;
    }
  });
};

/**
 * Adds the `helpers` object to `app._` then:
 *
 *  - `async`: create an instance of `helper-cache'
 *  - `sync`: create an instance of `helper-cache'
 *
 * @param {Object} `app` Instance of templates
 */

function init(app) {
  app._.helpers = {};
  app._.helpers.async = new utils.Helpers({ bind: false });
  app._.helpers.sync = new utils.Helpers({ bind: false });
}
