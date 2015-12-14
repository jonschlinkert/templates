'use strict';

var utils = require('../utils');

module.exports = function initHelpers(app) {
  var async = utils.loader(app._.helpers.async, {async: true});
  var sync = utils.loader(app._.helpers.sync);

  /**
   * Register a template helper.
   *
   * ```js
   * {%= type %}.helper('upper', function(str) {
   *   return str.toUpperCase();
   * });
   * ```
   * @name .helper
   * @param {String} `name` Helper name
   * @param {Function} `fn` Helper function.
   * @api public
   */

  app.mixin('helper', function() {
    sync.apply(sync, arguments);
    return this;
  });

  /**
   * Register multiple template helpers.
   *
   * ```js
   * {%= type %}.helpers({
   *   foo: function() {},
   *   bar: function() {},
   *   baz: function() {}
   * });
   * ```
   * @name .helpers
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  app.mixin('helpers', function() {
    sync.apply(sync, arguments);
    return this;
  });

  /**
   * Get or set an async helper. If only the name is passed, the
   * helper is returned.
   *
   * ```js
   * {%= type %}.asyncHelper('upper', function(str, next) {
   *   next(null, str.toUpperCase());
   * });
   * ```
   * @name .asyncHelper
   * @param {String} `name` Helper name.
   * @param {Function} `fn` Helper function
   * @api public
   */

  app.mixin('asyncHelper', function() {
    async.apply(async, arguments);
    return this;
  });

  /**
   * Register multiple async template helpers.
   *
   * ```js
   * {%= type %}.asyncHelpers({
   *   foo: function() {},
   *   bar: function() {},
   *   baz: function() {}
   * });
   * ```
   * @name .asyncHelpers
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  app.mixin('asyncHelpers', function() {
    async.apply(async, arguments);
    return this;
  });

  /**
   * Register a namespaced helper group.
   *
   * ```js
   * // markdown-utils
   * {%= type %}.helperGroup('mdu', {
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

  app.mixin('helperGroup', function(name, helpers, isAsync) {
    helpers = utils.arrayify(helpers);
    var type = isAsync ? 'async' : 'sync';
    var cache = this._.helpers[type][name] = {};
    var loader = utils.loader(cache, {async: isAsync});
    loader.call(loader, helpers);
    return this;
  });
};
