/*!
 * templates <https://github.com/jonschlinkert/templates>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var path = require('path');
var Base = require('base-methods');
var helpers = require('./lib/helpers/');
var utils = require('./lib/utils');
var Views = require('./lib/views');
var List = require('./lib/list');
var View = require('./lib/view');
var lib = require('./lib/');

/**
 * This function is the main export of the templates module.
 * Initialize an instance of `templates` to create your
 * application.
 *
 * ```js
 * var templates = require('templates');
 * var app = templates();
 * ```
 * @param {Object} `options`
 * @api public
 */

function Templates(options) {
  if (!(this instanceof Templates)) {
    return new Templates(options);
  }
  Base.call(this);
  this.options = options || {};
  utils.renameKey(this);
  this.defaultConfig();
}

/**
 * `Templates` prototype methods
 */

Base.extend(Templates, {
  constructor: Templates,

  defaultConfig: function () {
    // decorate `option` method onto instance
    utils.option(this);

    // decorate `view` method onto instance
    utils.createView(this);

    for (var key in this.options.mixins) {
      this.mixin(key, this.options.mixins[key]);
    }

    this.define('_', {});
    this.engines = {};
    lib.helpers(this);
    this._.engines = new utils.Engines(this.engines);

    this.define('errors', {
      compile: {
        callback: 'is sync and does not take a callback function',
        engine: 'cannot find an engine for: ',
        method: 'expects engines to have a compile method',
      },
      render: {
        callback: 'is async and expects a callback function',
        engine: 'cannot find an engine for: ',
        method: 'expects engines to have a render method',
      }
    });

    this.cache = {};
    this.cache.data = {};
    this.cache.context = {};
    this.items = {};
    this.views = {};

    this.viewTypes = {
      layout: [],
      renderable: [],
      partial: []
    };

    this.inflections = {};
    this.listen();
  },

  /**
   * Initialize defaults
   */

  initialize: function () {
    this.define('Base', Base);
    this.define('View', this.options.View || View);
    this.define('List', this.options.List || List);
    this.define('Views', this.options.Views || Views);
    this.define('initialized', true);
  },

  /**
   * Listen for events
   */

  listen: function () {
    this.on('option', function (key, value) {
      if (key === 'mixins') this.visit('mixin', value);
    });

    this.on('error', function (err) {
      if (err && err.id === 'rethrow') console.error(err.reason);
    });
  },

  /**
   * Run a plugin on the instance.
   *
   * ```
   * var app = assemble()
   *   .use(require('foo'))
   *   .use(require('bar'))
   *   .use(require('baz'))
   * ```
   *
   * @name .use
   * @param {Function} fn
   * @return {Object}
   * @api public
   */

  use: function (fn) {
    fn.call(this, this);
    return this;
  },

  /**
   * Returns a new view, using the `View` class
   * currently defined on the instance.
   *
   * ```js
   * var view = app.view('foo', {conetent: '...'});
   * // or
   * var view = app.view({path: 'foo', conetent: '...'});
   * ```
   * @name .view
   * @param {String|Object} `key` View key or object
   * @param {Object} `value` If key is a string, value is the view object.
   * @return {Object} returns the `view` object
   * @api public
   */

  /**
   * Set, get and load data to be passed to templates as
   * context at render-time.
   *
   * ```js
   * app.data('a', 'b');
   * app.data({c: 'd'});
   * console.log(app.cache.data);
   * //=> {a: 'b', c: 'd'}
   * ---
   * @name .data
   * @param {String|Object} `key` Pass a key-value pair or an object to set.
   * @param {any} `val` Any value when a key-value pair is passed. This can also be options if a glob pattern is passed as the first value.
   * @return {Object} Returns an instance of `Templates` for chaining.
   * @api public
   */

  data: function (key, val) {
    if (utils.isObject(key)) {
      this.visit('data', key);
      return this;
    }

    var isGlob = typeof val === 'undefined' || utils.hasGlob(key);
    if (utils.isValidGlob(key) && isGlob) {
      var opts = utils.extend({}, this.options, val);
      var data = utils.requireData(key, opts);
      if (data) this.visit('data', data);
      return this;
    }

    key = 'cache.data.' + key;
    this.set(key, val);
    return this;
  },

  /**
   * Create a new view collection. View collections are decorated
   * with special methods for getting, setting and rendering
   * views from that collection. Collections created with this method
   * are not stored on `app.views` as with the [create](#create) method.
   *
   * ```js
   * var collection = app.collection();
   * collection.addViews({...}); // add an object of views
   * collection.addView('foo', {content: '...'}); // add a single view
   *
   * // collection methods are chainable too
   * collection.addView('home.hbs', {content: 'foo <%= title %> bar'})
   *   .render({title: 'Home'}, function(err, res) {
   *     //=> 'foo Home bar'
   *   });
   * ```
   * @name .collection
   * @param  {Object} `opts` Collection options
   * @return {Object} Returns the `collection` instance for chaining.
   * @api public
   */

  collection: function (opts) {
    if (!this.initialized) this.initialize();
    var collection = null;
    var Views = this.get('Views');

    if (opts instanceof Views) {
      collection = opts;
      opts = {};
    } else {
      opts = opts || {};
      opts.View = opts.View || this.get('View');
      collection = new Views(opts);
    }
    // pass the `View` constructor from `App` to the collection
    return this.extendViews(collection, opts);
  },

  /**
   * Create a new view collection that is stored on the `app.views` object.
   * For example, if you create a collection named `posts`, then all `posts` will be
   * stored on `app.views.posts`, and a `posts` method will be added to
   * `app`, allowing you to add posts to the collection using `app.posts()`.
   *
   * ```js
   * app.create('posts');
   * app.posts({...}); // add an object of views
   * app.post('foo', {content: '...'}); // add a single view
   *
   * // collection methods are chainable too
   * app.post('home.hbs', {content: 'foo <%= title %> bar'})
   *   .render({title: 'Home'}, function(err, res) {
   *     //=> 'foo Home bar'
   *   });
   * ```
   * @name .create
   * @param  {String} `name` The name of the collection. Plural or singular form.
   * @param  {Object} `opts` Collection options
   * @param  {String|Array|Function} `loaders` Loaders to use for adding views to the created collection.
   * @return {Object} Returns the `collection` instance for chaining.
   * @api public
   */

  create: function(name, opts) {
    opts = opts || {};
    var collection = this.collection(opts);

    // get the collection inflections, e.g. page/pages
    var single = utils.single(name);
    var plural = utils.plural(name);

    // map the inflections for lookups
    this.inflections[single] = plural;

    // add inflections to collection options
    collection.option('inflection', single);
    collection.option('plural', plural);

    // prime the viewType(s) for the collection
    this.viewType(plural, collection.viewType());

    // add the collection to `app.views`
    this.views[plural] = collection.views;

    // create loader functions for adding views to this collection
    this.define(plural, collection.addViews.bind(collection));
    this.define(single, collection.addView.bind(collection));

    // decorate loader methods with collection methods
    this[plural].__proto__ = collection;
    this[single].__proto__ = collection;

    // create aliases on the collection for
    // addView/addViews to support chaining
    collection.define(plural, this[plural]);
    collection.define(single, this[single]);

    // add collection and view helpers
    helpers.plural(this, collection, opts);
    // helpers.single(this, this[single], opts);
    return collection;
  },

  /**
   * Decorate `view` instances in the collection.
   */

  extendView: function (view, options) {
    var opts = utils.merge({}, this.options, options);
    var app = this;

    // decorate `option` method onto `view`
    utils.option(view);

    // decorate `compile` method onto `view`
    view.compile = function () {
      var args = [this].concat([].slice.call(arguments));
      app.compile.apply(app, args);
      return this;
    };

    // decorate `render` method onto `view`
    view.render = function () {
      var args = [this].concat([].slice.call(arguments));
      app.render.apply(app, args);
      return this;
    };

    // decorate `context` method onto `view`
    view.context = function(locals) {
      return utils.merge({}, this.locals, this.data, locals);
    };

    // support custom `extendView` function on options
    if (typeof opts.extendView === 'function') {
      opts.extendView(view);
    }
    return view;
  },

  /**
   * Decorate `collection` intances.
   */

  extendViews: function (collection, options) {
    var opts = utils.merge({}, this.options, options);
    var app = this;

    var addView = collection.addView;
    utils.define(collection, 'addView', function () {
      var view = addView.apply(this, arguments);
      app.handleView('onLoad', view);
      return view;
    });

    var extendView = collection.extendView;
    utils.define(collection, 'extendView', function () {
      var view = extendView.apply(this, arguments);
      return app.extendView(view, options);
    });

    if (!collection.options.hasOwnProperty('renameKey')) {
      collection.option('renameKey', this.renameKey);
    }
    if (opts.extendViews) {
      collection = opts.extendViews(collection);
    }
    return collection;
  },

  /**
   * Set view types for a collection.
   *
   * @param {String} `plural` e.g. `pages`
   * @param {Object} `options`
   */

  viewType: function(plural, types) {
    var len = types.length, i = 0;
    while (len--) {
      var type = types[i++];
      this.viewTypes[type] = this.viewTypes[type] || [];
      if (this.viewTypes[type].indexOf(plural) === -1) {
        this.viewTypes[type].push(plural);
      }
    }
    return types;
  },

  /**
   * Find a view by `name`, optionally passing a `collection` to limit
   * the search. If no collection is passed all `renderable` collections
   * will be searched.
   *
   * ```js
   * var page = app.find('my-page.hbs');
   *
   * // optionally pass a collection name as the second argument
   * var page = app.find('my-page.hbs', 'pages');
   * ```
   * @name .find
   * @param {String} `name` The name/key of the view to find
   * @param {String} `colleciton` Optionally pass a collection name (e.g. pages)
   * @return {Object|undefined} Returns the view if found, or `undefined` if not.
   * @api public
   */

  find: function (name, collection) {
    if (typeof name !== 'string') {
      throw new TypeError('expected name to be a string.');
    }
    if (typeof collection === 'string') {
      return this[collection].getView(name);
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
   * Get view `key` from the specified `collection`.
   *
   * ```js
   * var view = app.getView('pages', 'a/b/c.hbs');
   *
   * // optionally pass a `renameKey` function to modify the lookup
   * var view = app.getView('pages', 'a/b/c.hbs', function(fp) {
   *   return path.basename(fp);
   * });
   * ```
   * @name .getView
   * @param {String} `collection` Collection name, e.g. `pages`
   * @param {String} `key` Template name
   * @param {Function} `fn` Optionally pass a `renameKey` function
   * @return {Object}
   * @api public
   */

  getView: function(collection, key, fn) {
    var views = this.getViews(collection);
    // use custom renameKey function
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
   * Get all views from a `collection` using the collection's
   * singular or plural name.
   *
   * ```js
   * var pages = app.getViews('pages');
   * //=> { pages: {'home.hbs': { ... }}
   *
   * var posts = app.getViews('posts');
   * //=> { posts: {'2015-10-10.md': { ... }}
   * ```
   *
   * @name .getViews
   * @param {String} `name` The collection name, e.g. `pages` or `page`
   * @return {Object}
   * @api public
   */

  getViews: function(name) {
    var orig = name;
    if (utils.isObject(name)) return name;
    if (!this.views.hasOwnProperty(name)) {
      name = this.inflections[name];
    }
    if (!this.views.hasOwnProperty(name)) {
      throw new Error('getViews cannot find collection: ' + orig);
    }
    return this.views[name];
  },

  /**
   * Returns the first view from `collection` with a key
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
   * @name .matchView
   * @param {String} `collection` Collection name.
   * @param {String} `pattern` glob pattern
   * @param {Object} `options` options to pass to [micromatch][]
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
   * Returns any views from the specified collection with keys
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
   * @name .matchViews
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
   * Add `Router` and `Route` to the prototype
   */

  Router: utils.router.Router,
  Route: utils.router.Route,

  /**
   * Lazily initalize `router`, to allow options to
   * be passed in after init.
   */

  lazyRouter: function(methods) {
    if (typeof this.router === 'undefined') {
      this.define('router', new this.Router({
        methods: utils.methods
      }));
    }
    if (typeof methods !== 'undefined') {
      this.router.method(methods);
    }
  },

  /**
   * Handle a middleware `method` for `view`.
   *
   * ```js
   * app.handle('customMethod', view, callback);
   * ```
   * @name .handle
   * @param {String} `method` Name of the router method to handle. See [router methods](./docs/router.md)
   * @param {Object} `view` View object
   * @param {Function} `callback` Callback function
   * @return {Object}
   * @api public
   */

  handle: function (method, view, locals, cb) {
    if (typeof locals === 'function') {
      cb = locals;
      locals = {};
    }

    this.lazyRouter();
    if (!view.options.handled) {
      view.options.handled = [];
    }

    if (typeof cb !== 'function') {
      cb = this.handleError(method, view);
    }

    view.options.method = method;
    view.options.handled.push(method);
    if (view.emit) {
      view.emit('handle', method);
    }

    this.router.handle(view, this.handleError(method, view, cb));
    return this;
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
    view.options = view.options || {};
    if (!view.options.handled) {
      view.options.handled = [];
    }
    if (view.options.handled.indexOf(method) < 0) {
      this.handle.apply(this, arguments);
      this.emit(method, view, locals);
    }
    return this;
  },

  /**
   * Handle middleware errors.
   */

  handleError: function(method, view, cb) {
    if (typeof cb !== 'function') cb = utils.noop;
    var app = this;
    return function (err) {
      if (err) {
        if (err._handled) return cb();
        err.reason = 'Templates#handle' + method + ': ' + view.path;
        err._handled = true;
        app.emit('error', err);
        return cb(err);
      }
      cb(null, view);
    };
  },

  /**
   * Create a new Route for the given path. Each route contains
   * a separate middleware stack.
   *
   * See the [route API documentation][route-api] for details on
   * adding handlers and middleware to routes.
   *
   * ```js
   * app.create('posts');
   * app.route(/blog/)
   *   .all(function(view, next) {
   *     // do something with view
   *     next();
   *   });
   *
   * app.post('whatever', {path: 'blog/foo.bar', content: 'bar baz'});
   * ```
   * @param {String} `path`
   * @return {Object} `Route` for chaining
   * @api public
   */

  route: function(path) {
    this.lazyRouter();
    return this.router.route.apply(this.router, arguments);
  },

  /**
   * Special route method that works just like the `router.METHOD()`
   * methods, except that it matches all verbs.
   *
   * ```js
   * app.all(/\.hbs$/, function(view, next) {
   *   // do stuff to view
   *   next();
   * });
   * ```
   * @name .all
   * @param {String} `path`
   * @param {Function} `callback`
   * @return {Object} `this` for chaining
   * @api public
   */

  all: function(path/*, callback*/) {
    var route = this.route(path);
    route.all.apply(route, [].slice.call(arguments, 1));
    return this;
  },

  /**
   * Add callback triggers to route parameters, where
   * `name` is the name of the parameter and `fn` is the
   * callback function.
   *
   * ```js
   * app.param('title', function (view, next, title) {
   *   //=> title === 'foo.js'
   *   next();
   * });
   *
   * app.onLoad('/blog/:title', function (view, next) {
   *   //=> view.path === '/blog/foo.js'
   *   next();
   * });
   * ```
   * @name .param
   * @param {String} `name`
   * @param {Function} `fn`
   * @return {Object} Returns the instance of `Templates` for chaining.
   * @api public
   */

  param: function(name/*, fn*/) {
    this.lazyRouter();
    this.router.param.apply(this.router, arguments);
    return this;
  },

  /**
   * Register a view engine callback `fn` as `ext`.
   *
   * ```js
   * app.engine('hbs', require('engine-handlebars'));
   *
   * // using consolidate.js
   * var engine = require('consolidate');
   * app.engine('jade', engine.jade);
   * app.engine('swig', engine.swig);
   *
   * // get a registered engine
   * var swig = app.engine('swig');
   * ```
   * @param {String|Array} `exts` String or array of file extensions.
   * @param {Function|Object} `fn` or `settings`
   * @param {Object} `settings` Optionally pass engine options as the last argument.
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
   */

  setEngine: function(ext, fn, settings) {
    ext = utils.formatExt(ext);
    if (!this.option('view engine')) this.option('view engine', ext);
    this._.engines.setEngine(ext, fn, settings);
    return this;
  },

  /**
   * Get the engine settings registered for the given `ext`.
   *
   * @param {String} `ext` The engine to get.
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

  applyLayout: function(view, locals) {
    if (view.options.layoutApplied) {
      return view;
    }

    // handle pre-layout middleware
    this.handle('preLayout', view);

    // get the layout stack
    var stack = {}, registered = 0;
    var alias = this.viewTypes.layout;
    var len = alias.length, i = 0;

    while (len--) {
      var views = this.views[alias[i++]];
      for (var key in views) {
        stack[key] = views[key];
        registered++;
      }
    }

    // get the name of the first layout
    var self = this;
    var name = view.layout;
    var str = view.content;

    // if no layout is defined, move on
    if (typeof name === 'undefined') {
      return view;
    }

    if (registered === 0) {
      throw new Error('no layouts are registered.');
    }

    if (!stack.hasOwnProperty(name)) {
      throw new Error('cannot find layout: ' + name);
    }

    var opts = {};
    utils.extend(opts, this.options);
    utils.extend(opts, view.options);
    utils.extend(opts, view.context());

    // Handle each layout before it's applied to a view
    function handleLayout(obj, stats/*, depth*/) {
      view.currentLayout = obj.layout;
      view.define('layoutStack', stats.history);
      self.handle('onLayout', view);
      delete view.currentLayout;
    }

    // actually apply the layout
    var res = utils.layouts(str, name, stack, opts, handleLayout);
    if (res.result === str) {
      throw new Error('layout was not applied to: ' + view.path);
    }

    view.option('layoutApplied', true);
    view.option('layoutStack', res.history);
    view.contents = new Buffer(res.result);

    // handle post-layout middleware
    this.handle('postLayout', view);
    return view;
  },


  /**
   * Compile `content` with the given `locals`.
   *
   * ```js
   * var indexPage = app.page('some-index-page.hbs');
   * var view = app.compile(indexPage);
   * // view.fn => [function]
   *
   * // you can call the compiled function more than once
   * // to render the view with different data
   * view.fn({title: 'Foo'});
   * view.fn({title: 'Bar'});
   * view.fn({title: 'Baz'});
   * ```
   *
   * @name .compile
   * @param  {Object|String} `view` View object.
   * @param  {Object} `locals`
   * @param  {Boolean} `isAsync` Load async helpers
   * @return {Object} View object with `fn` property with the compiled function.
   * @api public
   */

  compile: function(view, locals, isAsync) {
    if (typeof locals === 'boolean') {
      isAsync = locals;
      locals = {};
    }

    if (typeof locals === 'function' || typeof isAsync === 'function') {
      throw this.error('compile', 'callback');
    }

    // get the engine to use
    locals = utils.merge({settings: {}}, locals);
    var extname = view.ext || (view.ext = path.extname(view.path));
    var ext = locals.engines || view.engine || extname;
    var engine = this.getEngine(ext);

    if (engine && engine.options) {
      locals.settings = utils.merge({}, locals.settings, engine.options);
    }

    if (typeof engine === 'undefined') {
      throw this.error('compile', 'engine', view.ext);
    }

    var ctx = view.context(locals);

    // apply layout
    view = this.applyLayout(view, ctx);

    // handle `preCompile` middleware
    this.handleView('preCompile', view, locals);

    // Bind context to helpers before passing to the engine.
    this.bindHelpers(view, locals, ctx, (locals.async = isAsync));

    // shallow clone the context and locals
    var settings = utils.extend({}, ctx, locals);

    // compile the string
    var str = view.contents.toString();
    view.fn = engine.compile(str, settings);

    // handle `postCompile` middleware
    this.handleView('postCompile', view, locals);
    return view;
  },

  /**
   * Render a view with the given `locals` and `callback`.
   *
   * ```js
   * var blogPost = app.post.getView('2015-09-01-foo-bar');
   * app.render(blogPost, {title: 'Foo'}, function(err, view) {
   *   // `view` is an object with a rendered `content` property
   * });
   * ```
   * @name .render
   * @param  {Object|String} `view` Instance of `View`
   * @param  {Object} `locals` Locals to pass to template engine.
   * @param  {Function} `callback`
   * @api public
   */

  render: function (view, locals, cb) {
    if (typeof locals === 'function') {
      cb = locals;
      locals = {};
    }

    // if `view` is a function, it's probably from chaining
    // a collection method
    if (typeof view === 'function') {
      return view.call(this);
    }

    // if `view` is a string, see if it's a cached view
    if (typeof view === 'string') {
      view = this.find(view);
    }

    view.locals = utils.merge({}, view.locals, locals);
    locals = utils.merge({}, this.cache.data, view.locals);

    // handle `preRender` middleware
    this.handleView('preRender', view, locals);

    // get the engine
    var extname = view.ext || (view.ext = path.extname(view.path));
    var ext = locals.engines || view.engine || extname;
    var engine = this.getEngine(ext);

    if (typeof cb !== 'function') {
      throw this.error('render', 'callback');
    }
    if (typeof engine === 'undefined') {
      return cb(this.error('render', 'engine', extname));
    }

    var isAsync = typeof cb === 'function';

    // if it's not already compiled, do that first
    if (typeof view.fn !== 'function') {
      try {
        view = this.compile(view, locals, isAsync);
        return this.render(view, locals, cb);
      } catch(err) {
        this.emit('error', err);
        return cb.call(this, err);
      }
    }

    var opts = this.options;
    var ctx = view.context(locals);
    var context = this.context(view, ctx, locals);

    // render the view
    return engine.render(view.fn, context, function (err, res) {
      if (err) {
        if (opts.rethrow !== false) {
          err = this.rethrow('render', err, view, context);
        }
        this.emit('error', err);
        return cb.call(this, err);
      }

      view.contents = res;
      // handle `postRender` middleware
      this.handle('postRender', view, locals, cb);
    }.bind(this));
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
    var opts = utils.extend({}, this.options, locals);
    var partials = {};
    var self = this;

    names.forEach(function (name) {
      var collection = self.views[name];
      for (var key in collection) {
        var view = collection[key];

        // handle `onMerge` middleware
        self.handleView('onMerge', view, locals);

        if (view.options.nomerge) return;
        if (opts.mergePartials !== false) {
          name = 'partials';
        }

        // convert the partial to:
        //=> {'foo.hbs': 'some content...'};
        partials[name] = partials[name] || {};
        partials[name][key] = view.content;
      }
    });
    return partials;
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
    utils.extend(obj, ctx);
    utils.extend(obj, this.cache.data);
    utils.extend(obj, view.locals);
    utils.extend(obj, view.data);
    utils.extend(obj, locals);
    obj.view = view;
    return obj;
  },

  /**
   * Bind context to helpers.
   */

  bindHelpers: function (view, locals, context, isAsync) {
    var helpers = {};
    utils.extend(helpers, this.options.helpers);
    utils.extend(helpers, this._.helpers.sync);

    if (isAsync) utils.extend(helpers, this._.helpers.async);
    utils.extend(helpers, locals.helpers);

    // build the context to expose as `this` in helpers
    var thisArg = {};
    thisArg.options = utils.extend({}, this.options, locals);
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
    this.lazyRouter(methods);
    methods.forEach(function (method) {
      this.define(method, function(path) {
        var route = this.route(path);
        var args = [].slice.call(arguments, 1);
        route[method].apply(route, args);
        return this;
      }.bind(this));
    }.bind(this));
  },

  /**
   * Format an error
   *
   * TODO:
   *  - add engine info to error
   */

  error: function(method, id, msg) {
    var ctx = this.errors[method][id];
    var reason = 'Templates#' + method + ' ' + ctx + (msg || '');
    var err = new Error(reason);
    err.reason = reason;
    err.id = id;
    err.msg = msg;
    this.emit('error', err);
    return err;
  },

  /**
   * Rethrow an error in the given context to
   * get better error messages.
   */

  rethrow: function(method, err, view, context) {
    try {
      utils.rethrow(view.contents.toString(), {
        data: context,
        fp: view.path
      });
    } catch (msg) {
      err.method = method;
      err.reason = msg;
      err.id = 'rethrow';
      return err;
    }
  },

  /**
   * Mix in a prototype method
   */

  mixin: function(key, value) {
    Templates.prototype[key] = value;
  }
});

// Add router methods to Templates
utils.methods.forEach(function (method) {
  Templates.prototype[method] = function(path) {
    var route = this.route(path);
    var args = [].slice.call(arguments, 1);
    route[method].apply(route, args);
    return this;
  };
});

/**
 * Expose `Templates`
 */

module.exports = Templates;

/**
 * Expose constructors
 */

module.exports.Group = require('./lib/group');
module.exports.View = View;
module.exports.List = List;
module.exports.Views = Views;

/**
 * Expose utils
 */

module.exports.utils = utils;
