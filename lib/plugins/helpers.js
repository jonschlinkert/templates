'use strict';

var utils = require('../utils');
var init = require('./init');

module.exports = function initHelpers(app) {
  var Helpers = utils.Helpers;

  if (!app.hasOwnProperty('_')) {
    app.use(init);
  }

  function create(inst, name, isAsync) {
    var key = ['_.helpers', name].join('.');
    var val = inst.get(key);
    if (val) return val;

    inst.set(key, new Helpers({
      isAsync: isAsync === true,
      bind: false
    }));

    return inst.get(key);
  }

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
    this.helpers.apply(this, arguments);
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
    var sync = create(this, 'sync');
    var cache = {};
    var loader = utils.loader(cache);
    loader.apply(loader, arguments);
    for (var key in cache) {
      sync.addHelper(key, cache[key]);
    }
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
    this.asyncHelpers.apply(this, arguments);
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
   * @name .asyncHelper
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  app.mixin('asyncHelpers', function() {
    var async = create(this, 'async', true);
    var cache = {};
    var loader = utils.loader(cache);
    loader.apply(loader, arguments);
    for (var key in cache) {
      async.addAsyncHelper(key, cache[key]);
    }
    return this;
  });

  /**
   * Register a namespaced helper group.
   *
   * ```js
   * // markdown-utils
   * {%= type %}.helperGroup('mdu', {
   *   reflink: function() {},
   *   link: function() {},
   * });
   *
   * //=> <%%= mdu.link() %>
   * ```
   * @name .helperGroup
   * @param {Object|Array} `helpers` Object, array of objects, or glob patterns.
   * @api public
   */

  app.mixin('helperGroup', function(name, isAsync) {
    var args = [].slice.call(arguments, 1);
    var last = args[args.length - 1];
    if (typeof last === 'boolean') {
      isAsync = args.pop();
    } else {
      isAsync = false;
    }
    var key = [isAsync ? 'async' : 'sync', name].join('.');
    var helpers = create(this, key, isAsync);
    var cache = {};
    var loader = utils.loader(cache);
    loader.apply(loader, args);
    for (var key in cache) {
      helpers.addHelper(key, cache[key]);
    }
    return this;
  });
};
