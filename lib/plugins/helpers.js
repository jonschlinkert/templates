'use strict';

var utils = require('../utils');

module.exports = function initHelpers(app) {
  var async = utils.loader(app._.helpers.async, {async: true});
  var sync = utils.loader(app._.helpers.sync);

  /**
   * Register a template helper.
   *
   * ```js
   * {%= appname %}.helper('upper', function(str) {
   *   return str.toUpperCase();
   * });
   * ```
   * @name .helper
   * @param {String} `name` Helper name
   * @param {Function} `fn` Helper function.
   * @api public
   */

  app.define('helper', function() {
    sync.apply(sync, arguments);
    return this;
  });

  /**
   * Register multiple template helpers.
   *
   * ```js
   * {%= appname %}.helpers({
   *   foo: function() {},
   *   bar: function() {},
   *   baz: function() {}
   * });
   * ```
   * @name .helpers
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  app.define('helpers', function() {
    sync.apply(sync, arguments);
    return this;
  });

  /**
   * Get a sync helper that was previously registered.
   *
   * ```js
   * {%= appname %}.helper('upper', function(str) {
   *   return str.toUpperCase();
   * });
   * ```
   * @name .helper
   * @param {String} `name` Helper name
   * @param {Function} `fn` Helper function.
   * @api public
   */

  app.define('getHelper', function(name, async) {
    return this.get(['_.helpers', async ? 'async' : 'sync', name]);
  });

  /**
   * Register an async helper.
   *
   * ```js
   * {%= appname %}.asyncHelper('upper', function(str, next) {
   *   next(null, str.toUpperCase());
   * });
   * ```
   * @name .asyncHelper
   * @param {String} `name` Helper name.
   * @param {Function} `fn` Helper function
   * @api public
   */

  app.define('asyncHelper', function() {
    async.apply(async, arguments);
    return this;
  });

  /**
   * Register multiple async template helpers.
   *
   * ```js
   * {%= appname %}.asyncHelpers({
   *   foo: function() {},
   *   bar: function() {},
   *   baz: function() {}
   * });
   * ```
   * @name .asyncHelpers
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  app.define('asyncHelpers', function() {
    async.apply(async, arguments);
    return this;
  });

  /**
   * Register a namespaced helper group.
   *
   * ```js
   * // markdown-utils
   * {%= appname %}.helperGroup('mdu', {
   *   foo: function() {},
   *   bar: function() {},
   * });
   *
   * // Usage:
   * // <%%= mdu.foo() %>
   * // <%%= mdu.bar() %>
   * ```
   * @name .helperGroup
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  app.define('helperGroup', function(name, helpers, isAsync) {
    helpers = utils.arrayify(helpers);
    var type = isAsync ? 'async' : 'sync';
    var cache = this._.helpers[type][name] = {};
    var loader = utils.loader(cache, {async: isAsync});
    loader.call(loader, helpers);
    return this;
  });
};
