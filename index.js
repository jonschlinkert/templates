/*!
 * templates <https://github.com/jonschlinkert/templates>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var Base = require('base-methods');
var router = require('en-route');
var extend = require('extend-shallow');
var define = require('define-property');
var utils = require('./lib/utils')(require);
var Views = require('./lib/views');
var List = require('./lib/list');
var View = require('./lib/view');
var lib = require('./lib/');


function Templates(options) {
  if (!(this instanceof Templates)) {
    return new Templates(options);
  }
  Base.call(this);
  this.options = options || {};
  this.initialize();
}

Base.extend(Templates);

/**
 * `Templates` prototype methods
 */

utils.delegate(Templates.prototype, {
  constructor: Templates,

  /**
   * Initialize defaults
   */

  initialize: function () {
    this.engines = {};
    this.define('_', {});
    this._.engines = new utils.Engines(this.engines);

    this.listen();
    // lib.helpers.methods(this);
    // lib.lookup(this);

    // temporary.
    this.define('errors', {
      compile: {
        engine: 'cannot find an engine for: ',
        method: 'expects engines to have a compile method',
      },
      render: {
        callback: 'is async and expects a callback function: ',
        engine: 'cannot find an engine for: ',
        method: 'expects engines to have a render method',
      }
    });

    this.cache = {};
    this.cache.data = {};
    this.cache.context = {};

    this.items = {};
    this.views = {};

    this.define('Base', require('base-methods'));
    this.define('View', this.options.View || View);
    this.define('List', this.options.List || List);
    this.define('Views', this.options.Views || Views);

    this.viewTypes = {
      layout: [],
      renderable: [],
      partial: []
    };

    this.inflections = {};
    this.handlers(utils.methods);
  },

  /**
   * Listen for events
   */

  listen: function () {
    this.on('error', function (msg, err) {
      console.error(msg.message, err);
    });

    this.on('option', function (key, value) {
      for (var key in this.options.mixins) {
        this.define(key, this.options.mixins[key]);
      }
    });
  },

  /**
   * Create a new `Views` collection.
   *
   * ```js
   * app.create('foo');
   * app.foo('*.hbs');
   * var view = app.foo.get('baz.hbs');
   * ```
   *
   * @name .create
   * @param  {String} `name` The name of the collection. Plural or singular form.
   * @param  {Object} `opts` Collection options
   * @param  {String|Array|Function} `loaders` Loaders to use for adding views to the created collection.
   * @return {Object} Returns the `Template` instance for chaining.
   * @api public
   */

  create: function(name, opts) {
    var collection = !(opts instanceof this.Views)
      ? new this.Views(opts)
      : opts;

    collection.set('View', this.View);

    // get the collection inflections, e.g. page/pages
    var single = utils.single(name);
    var plural = utils.plural(name);

    // map the inflections for lookups
    this.inflections[single] = plural;

    // set defaults on the collection options
    // opts = utils.merge({ renameKey: this.options.renameKey }, opts);

    // add the collection to `app.views`
    this.views[plural] = collection.views;

    // create loader functions for adding views to this collection
    define(this, plural, collection.addViews.bind(collection));
    define(this, single, collection.addView.bind(collection));

    // decorate loader methods with collection methods
    utils.forward(this[plural], collection);
    utils.forward(this[single], collection);

    // create aliases on the collection for
    // addView/addViews to support chaining
    collection.set(plural, this[plural]);
    collection.set(single, this[single]);
    return this;
  },

  /**
   * Returns the first template from the given collection with a key
   * that matches the given glob pattern.
   *
   * ```js
   * var pages = app.matchView('pages', 'home.*');
   * //=> {'home.hbs': { ... }, ...}
   *
   * var posts = app.matchView('posts', '2010-*');
   * //=> {'2015-10-10.md': { ... }, ...}
   * ```
   *
   * @param {String} `collection` Collection name.
   * @param {String} `pattern` glob pattern
   * @param {Object} `options` options to pass to [micromatch]
   * @return {Object}
   * @api public
   */

  matchView: function(collection, pattern, options) {
    var views = this.getViews(collection);
    if (views.hasOwnProperty(pattern)) {
      return views[pattern];
    }
    return utils.matchKey(views, pattern, options);
  },

  /**
   * Returns any templates from the specified collection with keys
   * that match the given glob pattern.
   *
   * ```js
   * var pages = app.matchViews('pages', 'home.*');
   * //=> {'home.hbs': { ... }, ...}
   *
   * var posts = app.matchViews('posts', '2010-*');
   * //=> {'2015-10-10.md': { ... }, ...}
   * ```
   *
   * @param {String} `collection` Collection name.
   * @param {String} `pattern` glob pattern
   * @param {Object} `options` options to pass to [micromatch]
   * @return {Object}
   * @api public
   */

  matchViews: function(collection, pattern, options) {
    var views = this.getViews(collection);
    return utils.matchKeys(views, pattern, options);
  },

  /**
   * Get a specific template from the specified collection.
   *
   * ```js
   * app.getView('pages', 'a.hbs', function(fp) {
   *   return path.basename(fp);
   * });
   * ```
   *
   * @param {String} `collectionName` Collection name, like `pages`
   * @param {String} `key` Template name
   * @param {Function} `fn` Optionally pass a `renameKey` function
   * @return {Object}
   * @api public
   */

  getView: function(collection, key, fn) {
    var views = this.getViews(collection);
    // if a custom renameKey function is passed, try using it
    if (typeof fn === 'function') {
      key = fn(key);
    }
    if (views.hasOwnProperty(key)) {
      return views[key];
    }
    // try again with the default renameKey function
    fn = this.option('renameKey');
    var name;
    if (typeof fn === 'function') {
      name = fn(key);
    }
    if (name && name !== key && views.hasOwnProperty(name)) {
      return views[name];
    }
    return null;
  },

  /**
   * Get a view `collection` by its singular or plural name.
   *
   * ```js
   * var pages = app.getViews('pages');
   * //=> { pages: {'home.hbs': { ... }}
   *
   * var posts = app.getViews('posts');
   * //=> { posts: {'2015-10-10.md': { ... }}
   * ```
   *
   * @param {String} `plural` The plural collection name, e.g. `pages`
   * @return {Object}
   * @api public
   */

  getViews: function(plural) {
    if (utils.isObject(plural)) return plural;
    if (!this.views.hasOwnProperty(plural)) {
      plural = this.inflections[plural];
    }
    if (!this.views.hasOwnProperty(plural)) {
      throw new Error('getViews cannot find collection' + plural);
    }
    return this.views[plural];
  },

  /**
   * Get a view by `name` from the given `collection`.
   */

  lookup: function (name, collection) {
    if (typeof name !== 'string') {
      return null;
    }

    if (typeof collection === 'string') {
      return this[collection].get(name);
    }

    var collections = this.viewTypes.renderable;
    var len = collections.length, i = 0;
    while (len--) {
      var plural = collections[i++];
      var views = this.views[plural];
      var res;
      if (res = views[name]) {
        return res;
      }
    }
  },

  /**
   * Add `Router` to the prototype
   */

  Router: router.Router,

  /**
   * Lazily initalize `router`, to allow options to
   * be passed in after init.
   */

  lazyRouter: function() {
    if (typeof this.router === 'undefined') {
      this.define('router', new this.Router({
        methods: utils.methods
      }));
    }
  },

  /**
   * Handle middleware for the given `view` and locals.
   *
   * ```js
   * app.handle('customHandle', view);
   * ```
   *
   * @name .handle
   * @param {String} `method` Router VERB
   * @param {Object} `view` View object
   * @param {Object} `locals`
   * @param {Function} `cb`
   * @return {Object}
   * @api public
   */

  handle: function (method, view, locals, cb) {
    if (typeof locals === 'function') {
      cb = locals;
      locals = {};
    }

    this.lazyRouter();
    view.options = view.options || {};
    view.options.handled = view.options.handled || [];

    if (typeof cb !== 'function') {
      cb = this.handleError(method, view);
    }

    view.options.method = method;
    view.options.handled.push(method);
    if (view.emit) {
      view.emit('handle', method);
    }

    this.router.handle(view, function (err) {
      if (err) return cb(err);
      cb(null, view);
    });
  },

  /**
   * Run the given middleware handler only if the view has not
   * already been handled by the method.
   *
   * @name .handleView
   * @param  {Object} `method`
   * @param  {Object} `view`
   * @param  {Object} `locals`
   */

  handleView: function (method, view, locals/*, cb*/) {
    if (view.options.handled.indexOf(method) === -1) {
      this.handle.apply(this, arguments);
    }
    this.emit(method, view, locals);
  },

  /**
   * Handle middleware errors.
   */

  handleError: function(method, view) {
    return function (err) {
      if (err) {
        err.reason = 'Templates#handle' + method + ': ' + view.path;
        return err;
      }
    };
  },

  /**
   * Special-cased "all" method, applying the given route `path`,
   * middleware, and callback.
   *
   * @name .all
   * @param {String} `path`
   * @param {Function} `callback`
   * @return {Object} `this` for chaining
   */

  all: function(path/*, callback*/) {
    this.lazyRouter();
    var route = this.router.route(path);
    route.all.apply(route, [].slice.call(arguments, 1));
    return this;
  },

  /**
   * Proxy to `Router#param`
   *
   * @name .param
   * @param {String} `name`
   * @param {Function} `fn`
   * @return {Object} Returns the instance of `Templates` for chaining.
   */

  param: function(/*name, fn*/) {
    this.lazyRouter();
    this.router.param.apply(this.router, arguments);
    return this;
  },

  /**
   * Register a view engine callback `fn` as `ext`.
   *
   * @param {String|Array} `exts` One or more file extensions.
   * @param {Function|Object} `fn` or `settings`
   * @param {Object} `settings`
   * @api public
   */

  engine: function(exts, fn, settings) {
    if (arguments.length === 1 && typeof exts === 'string') {
      return this.getEngine(exts);
    }

    if (!Array.isArray(exts) && typeof exts !== 'string') {
      throw new TypeError('expected engine ext to be a string or array.');
    }
    utils.arrayify(exts).forEach(function (ext) {
      this.setEngine(ext, fn, settings);
    }.bind(this));
    return this;
  },

  /**
   * Register an engine for `ext` with the given `settings`
   *
   * @param {String} `ext` The engine to get.
   * @api public
   */

  setEngine: function(ext, fn, settings) {
    this._.engines.setEngine(utils.formatExt(ext), fn, settings);
    return this;
  },

  /**
   * Get the engine settings registered for the given `ext`.
   *
   * @param {String} `ext` The engine to get.
   * @api public
   */

  getEngine: function(ext) {
    ext = utils.formatExt(ext || this.option('view engine'));
    return this._.engines.getEngine(ext);
  },

  /**
   * Apply a layout to the given `view`.
   *
   * @name .applyLayout
   * @param  {Object} `view`
   * @return {Object} Returns a `view` object.
   */

  applyLayout: function(view) {
    if (view.options.layoutApplied) {
      return view;
    }

    // handle pre-layout middleware
    this.handle('preLayout', view);

    // get the layout stack
    var stack = {};
    var alias = this.viewTypes.layout;
    var len = alias.length, i = 0;

    while (len--) {
      var views = this.views[alias[i++]];
      for (var key in views) {
        var val = views[key];
        if (views.hasOwnProperty(key) && typeof val !== 'function' && val.path) {
          stack[key] = val;
        }
      }
    }

    // get the name of the first layout
    var name = view.layout;
    var str = view.content;
    var self = this;

    // Handle each layout before it's applied to a view
    function handleLayout(layoutObj) {
      view.currentLayout = layoutObj.layout;
      self.handle('onLayout', view);
      delete view.currentLayout;
    }

    var opts = {};
    extend(opts, this.options);
    extend(opts, view.options);
    extend(opts, view.context());

    // actually apply the layout
    var res = utils.layouts(str, name, stack, opts, handleLayout);

    view.option('layoutStack', res.history);
    view.option('layoutApplied', true);
    view.content = res.result;

    // handle post-layout middleware
    this.handle('postLayout', view);
    return view;
  },


  /**
   * Merge "partials" view types. This is necessary for template
   * engines that only support one class of partials.
   *
   * @name .mergePartials
   * @param {Object} `locals`
   * @param {Array} `viewTypes` Optionally pass an array of viewTypes to include.
   * @return {Object} Merged partials
   */

  mergePartials: function (locals, viewTypes) {
    var names = viewTypes || this.viewTypes.partial;
    var opts = extend({}, this.options, locals);

    return names.reduce(function (acc, name) {
      var collection = this.views[name];

      utils.forOwn(collection, function (view, key) {
        // handle `onMerge` middleware
        this.handleView('onMerge', view, locals);

        if (view.options.nomerge) return;
        if (opts.mergePartials !== false) {
          name = 'partials';
        }
        acc[name] = acc[name] || {};
        acc[name][key] = view.content;
      }, this);
      return acc;
    }.bind(this), {});
  },

  /**
   * Build the context for the given `view` and `locals`.
   *
   * @name .context
   * @param  {Object} `view` Templates object
   * @param  {Object} `locals`
   * @return {Object} The object to be passed to engines/views as context.
   */

  context: function (view, ctx, locals) {
    var obj = {};
    extend(obj, ctx);
    extend(obj, this.cache.data);
    extend(obj, view.data);
    extend(obj, view.locals);
    extend(obj, locals);
    return obj;
  },

  /**
   * Bind context to helpers.
   */

  bindHelpers: function (view, locals, context, isAsync) {
    var helpers = {};
    extend(helpers, this.options.helpers);
    extend(helpers, this._.helpers.sync);

    if (isAsync) extend(helpers, this._.helpers.async);
    extend(helpers, locals.helpers);

    // build the context to expose as `this` in helpers
    var thisArg = {};
    thisArg.options = extend({}, this.options, locals);
    thisArg.context = context || {};
    thisArg.context.view = view;
    thisArg.app = this;

    // bind template helpers to the instance
    locals.helpers = utils.bindAll(helpers, thisArg);
  },

  /**
   * Add a router handler.
   *
   * @param  {String} `method` Method name.
   */

  handler: function (methods) {
    this.handlers(methods);
  },

  /**
   * Add default Router handlers to Templates.
   */

  handlers: function (methods) {
    this.lazyRouter();
    this.router.method(methods);
    utils.arrayify(methods).forEach(function (method) {
      this.define(method, function(path) {
        var route = this.router.route(path);
        var args = [].slice.call(arguments, 1);
        route[method].apply(route, args);
        return this;
      }.bind(this));
    }.bind(this));
  },

  /**
   * Format an error
   */

  error: function(method, id, msg) {
    return new Error(this.errors[method][id] + 'Templates#' + method + ' ' + msg);
  }
});

/**
 * Expose `Templates`
 */

module.exports = Templates;

/**
 * Expose constructors
 */

module.exports.View = View;
module.exports.List = List;
module.exports.Views = Views;

/**
 * Expose utils
 */

module.exports.utils = utils;
