'use strict';

const assert = require('assert');
const Emitter = require('./events');
const defaults = require('./defaults');
const engines = require('./engines');
const layouts = require('./layouts');
const resolve = require('./resolve');
const streams = require('./streams');
const utils = require('./utils');
const sync = require('./sync');
const { define, first, isObject, stripDot } = utils;

/**
 * This is the base class for the main "Templates" (app) class and the "Collection" class.
 * @extends {Class} Emitter
 * @param {Object} `options`
 */

class Common extends Emitter {
  constructor(options = {}) {
    super();
    // this.fns = new Set();
    this.ids = new Map();
    this.engines = new Map();
    this.views = new Map();
    this.defaults = defaults;
    this.options = { ...options };
    this.cache = { data: options.data || {} };

    this.helpers = this.options.helpers || {};
    this.resolveIds = resolve.bind(null, this);

    // engine
    this.engine.default = this.options.engine;
    this.engine('layout', layouts.engine(this));
    this.engine('noop', engines.noop());

    // trip the lazy router getter if handlers are defined
    if (this.options.handlers) this.router;
    if (this.options.sync === true) {
      sync.call(this, this);
    }
  }

  use(plugin) {
    this.emit('plugin', 'foo');
    let fn = wrap(plugin).call(this, this);
    let items = this.list || this.collections;
    if (typeof fn === 'function') {
      this.fns.add(fn);
      for (let key of Object.keys(items)) {
        this.run(items[key], null, [fn]);
      }
    }
    return this;
  }

  run(obj, options, fns = this.fns) {
    for (const fn of [...fns]) {
      obj.use ? obj.use(fn, options) : fn.call(obj, obj, options);
    }
  }

  opt(key, options, view) {
    if (options && options[key] !== void 0) return options[key];
    if (view && view[key] !== void 0) return view[key];
    return this.option(key);
  }

  /**
   * Get or set options on `app.options`.
   *
   * ```js
   * // set option
   * {%= type %}.option('foo', 'bar');
   * {%= type %}.option({ foo: 'bar' });
   * // get option
   * console.log({%= type %}.option('foo')); //=> 'bar'
   * ```
   * @name .option
   * @param {String|object} `key`
   * @param {Object} `val`
   * @return {Object} Returns the instance when setting, or the value when getting.
   * @api public
   */

  option(key, value) {
    if (isObject(key)) {
      this.options = { ...this.options, ...key };
      return this;
    }

    if (typeof key !== 'string' || key === '') {
      throw new TypeError('expected "key" to be a string or object');
    }

    if (value === void 0) {
      return this.defaults.get(key, this.options[key]);
    }

    if (key.slice(0, 3) === 'no-') {
      this.options[key.slice(3)] = !value;
    } else {
      this.options[key] = value;
    }
    return this;
  }

  /**
   * Get or set data on `app.cache.data`.
   *
   * ```js
   * // set data
   * {%= type %}.data('foo', 'bar');
   * {%= type %}.data({ foo: 'bar' });
   * // get data
   * console.log({%= type %}.data('foo')); //=> 'bar'
   * ```
   * @name .data
   * @param {String|object} `key`
   * @param {Object} `val`
   * @return {Object} Returns the instance when setting, or the value when getting.
   * @api public
   */

  data(key, value) {
    if (isObject(key)) {
      this.cache.data = { ...this.cache.data, ...key };
      return this;
    }

    if (typeof key !== 'string' || key === '') {
      throw new TypeError('expected "key" to be a string or object');
    }

    if (value === void 0) {
      return this.cache.data[key];
    }

    this.cache.data[key] = value;
    return this;
  }

  /**
   * Create a new view.
   *
   * ```js
   * {%= type %}.view('/some/template.hbs', {});
   * {%= type %}.view({ path: '/some/template.hbs', contents: Buffer.from('...') });
   * ```
   * @name .view
   * @param {String|object} `key` The view path, or object.
   * @param {Object} `val` View object, when `key` is a path string.
   * @return {Object} Returns the view.
   * @api public
   */

  view(key, view = {}) {
    if (typeof view === 'string') {
      view = { contents: Buffer.from(view) };
    }

    if (typeof key === 'string') {
      view.key = key;
      view.path = view.path || view.key;
    } else {
      view = key;
      key = null;
    }

    view = !this.View.isView(view) ? new this.View(view) : view;
    if (this.isCollection) {
      view.collection = this;
      view.kind = this.kind;
    }

    view.key = this.renameKey(view);
    return view;
  }

  /**
   * Register a view engine callback `fn` as `name`.
   *
   * ```js
   * {%= type %}.engine('hbs', require('engine-handlebars'));
   * ```
   * @name .engine
   * @param {String|array} `exts` String or array of file extensions.
   * @param {Object|function} `engine` Engine object or function.
   * @param {Object} `settings` Optionally pass engine options as the last argument.
   * @return {Object} Returns the given or cached engine.
   * @api public
   */

  engine(ext, engine) {
    if (Array.isArray(ext)) {
      ext.forEach(n => this.engine(n, engine));
      return engine;
    }

    let name = stripDot(ext);
    if (name && engine) {
      if (typeof engine === 'function') {
        let noop = this.engines.get('noop');
        engine = { render: engine };
        engine.renderSync = noop.renderSync;
        engine.compile = noop.compile;
        engine.name = name;
      } else if (!engine.name) {
        engine.name = name;
      }
      this.engines.set(name, engine);
      return engine;
    }

    if (name == null && typeof this.options.engine === 'string') {
      engine = this.engines.get(stripDot(this.options.engine));
    } else {
      engine = this.engines.get(name);
    }

    assert(engine, `engine "${name}" is not registered`);
    return engine;
  }

  /**
   * Register a helper function as `name`, or get helper `name` if
   * only one argument is passed.
   *
   * ```js
   * {%= type %}.helper('lowercase', str => str.toLowerCase());
   * console.log({%= type %}.helper('lowercase')) //=> [function lowercase]
   * ```
   * @name .helper
   * @param {String|object} `name` Helper name or object of helpers.
   * @param {Function} `helper` helper function, if name is not an object
   * @api public
   */

  helper(name, helper) {
    if (isObject(name)) {
      for (let key of Object.keys(name)) this.helper(key, name[key]);
      return this;
    }

    if (typeof helper !== 'function') return this.helpers[name];

    let app = this;
    let wrapped = function(...args) {
      if (this && typeof this === 'object') this.app = app;
      return helper.call(this, ...args);
    };

    if (this.options.asyncHelpers === true) {
      wrapped = resolve.wrap(this, name, helper);
    }

    define(wrapped, 'name', name);
    wrapped.helper = helper;
    this.helpers[name] = wrapped;
    this.emit('helper', name, wrapped, helper);
    return this;
  }

  /**
   * Recursively renders layouts and "nested" layouts on the given `view`.
   *
   * ```js
   * {%= type %}.renderLayout(view);
   * ```
   * @name .renderLayout
   * @param {Object} `view`
   * @param {Object} `options` Optionally pass an object of `layouts`.{% if (type === 'app') { %} Or views from any collections with type "layout" will be used. {% } %}
   * @api public
   */

  async renderLayout(view, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = null;
    }

    const engine = this.engines.get('layout');
    const opts = { ...this.options, ...options };

    if (opts.renderLayout === false || view.renderLayout === false) {
      return view;
    }

    opts.onLayout = fn || opts.onLayout;
    opts.layouts = opts.layouts || (this.kinds && this.kinds.layout) || {};

    await this.handle('preLayout', view);
    await engine.render.call(this, view, null, opts);
    await this.handle('postLayout', view);
    return view;
  }

  /**
   * Compile `view` with the given `options`.
   *
   * ```js
   * const view = {%= type %}.view({ path: 'some-view.hbs', contents: Buffer.from('...') });
   * {%= type %}.compile(view)
   *   .then(view => console.log(view.fn)) //=> [function]
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
   * @param  {Object} `options`
   * @return {Object} Returns a promise with the view.
   * @api public
   */

  async compile(val, options = {}) {
    const view = this.get(val);
    assert(this.View.isView(view), `cannot resolve view: ${val}`);

    // exit early
    if (view.render === false || options.render === false) return view;
    const name = first([view.engine, this.options.engine, options.engine]);
    const engine = name ? this.engine(name) : null;

    return this.compileView(view, engine, options);
  }

  async compileView(view, engine, options) {
    await this.renderLayout(view, options);
    await this.handle('preCompile', view);
    await engine.compile.call(this, view, options);
    await this.handle('postCompile', view);
    return view;
  }

  /**
   * Prepare a view to be rendered. Gets the view, if `view.path` is defined,
   * creates options and context for the view, and detects the engine to use.
   * The options object will include any layouts, partials, or helpers to
   * pass to the engine.
   *
   * @param {object|string} val View or view.path.
   * @param {object} locals
   * @param {object} options
   * @return {object} Returns an object with `{ view, opts, context, engine }`
   * @api public
   */

  prepareRender(view, locals = {}, options = {}) {
    if (!this.opt('render', options, view)) return { view };
    if (!this.opt('engine', options, view)) return { view };

    const { helpers} = this;
    const localsOpts = pick(locals, ['helpers', 'layouts', 'partials']);
    const opts = { helpers, ...this.options, ...localsOpts, ...options };
    let data = this.cache.data;

    // if the view is on a collection, add data
    // defined on the collection to the context
    if (view.collection && view.collection !== this) {
      data = { ...data, ...view.collection.cache.data };
    }
    return { opts, context: { ...data, ...locals } };
  }

  /**
   * Render a view.
   *
   * @param {Object|string} `view` View path or object.
   * @param {Object} `locals` Data to use for rendering the view.
   * @param {Object} options
   * @return {Object}
   * @api public
   */

  // async render(val, locals, options) {
  //   let view = this.get(val);
  //   assert(this.View.isView(view), `expected a view: ${view}`);

  //   // exit early
  //   if (view.render === false || options.render === false || !view.engine) return view;

  //   const { helpers } = this;
  //   const localsOptions = pick(locals, ['helpers', 'layouts', 'partials']);
  //   const engineOptions = { helpers, ...this.options, ...localsOptions, ...options };
  //   let data = this.cache.data;

  //   // if the view is on a collection, add data
  //   // defined on the collection to the context
  //   if (view.collection && view.collection !== this) {
  //     data = { ...data, ...view.collection.cache.data };
  //   }

  //   // create context to use for rendering view.contents.
  //   const context = { ...data, ...locals };

  //   // compile the view
  //   await this.compile(view, engineOptions);

  //   // run "preRender" middleware
  //   await this.handle('preRender', view);

  //   // get the engine to use for rendering, and set the engine
  //   // on the context so that it can be used inside helpers.
  //   const engine = context.engine = this.engine(view.engine);

  //   // actually render the view
  //   await engine.render.call(this, view, context, engineOptions);

  //   // resolve any unresolved async helper IDs
  //   if (this.options.asyncHelpers === true) {
  //     view.contents = Buffer.from(String(await this.resolveIds(view.contents.toString())));
  //   }

  //   // run "postRender" middleware
  //   await this.handle('postRender', view);
  //   return view;
  // }

  async render(val, locals, options) {
    let view = this.get(val);
    assert(this.View.isView(view), `expected a view: ${view}`);

    // exit early
    if (!this.opt('render', options, view)) return view;
    if (!this.opt('engine', options, view)) return view;

    const { opts, context } = this.prepareRender(view, locals, options);
    return this.renderView(view, context, opts);
  }

  async renderView(view, locals, options) {
    const engine = this.engine(view.engine);

    await this.compileView(view, engine, options);
    await this.handle('preRender', view);
    await engine.render.call(this, view, locals, options);

    // resolve any unresolved async helper IDs
    if (this.options.sync !== true && this.options.asyncHelpers === true) {
      view.contents = Buffer.from(String(await this.resolveIds(view.contents.toString())));
    }

    // run "postRender" middleware
    await this.handle('postRender', view);
    return view;
  }

  /**
   * Lazily decorate the Router onto the instance so that
   * it's not loaded when users don't define router methods.
   * This improves intialization and runtime performance.
   */

  get router() {
    let router = this._router;
    if (router) return router;

    const { handlers, sync } = this.options;
    router = new utils.Router({ handlers, sync });
    router.mixin(this);

    router.on('handler', (name, handler) => {
      this[name] = handler.bind(router);
    });

    router.on('handle', (method, file, route) => {
      this.emit('handle', method, file, route);
      this.emit(method, file, route);
    });

    this.define('_router', router);
    return router;
  }

  /**
   * Add one or more middleware handler methods. Handler methods may also be
   * added by passing an array of handler names to the constructor on the
   * `handlers` option. This method is also aliased as `.handler()`.
   *
   * ```js
   * {%= type %}.handlers(['onLoad', 'preRender']);
   * ```
   * @name .handlers
   * @param {String|array} `methods` Method names
   * @param {Object} `options`
   * @return {Object} Returns the instance for chaining.
   * @api public
   */

  handlers(methods, options) {
    return this.router.handler(methods, { ...this.options, ...options });
  }
  handler(...args) {
    return this.handlers(...args);
  }

  /**
   * Run middleware `method` on the given `view`.
   *
   * ```js
   * // run a specific method
   * {%= type %}.handle('onLoad', view)
   *   .then(view => console.log('File:', view))
   *   .catch(console.error);
   *
   * // run multiple methods
   * {%= type %}.handle('onLoad', view)
   *   .then(view => app.handle('preRender', view))
   *   .catch(console.error);
   *
   * // run all methods
   * {%= type %}.handle(view)
   *   .then(view => console.log('File:', view))
   *   .catch(console.error);
   * ```
   * @name .handle
   * @param {String} `method` Middleware method to run.
   * @param {Object} `view`
   * @api public
   */

  handle(method, view) {
    if (typeof method === 'string' && this.router.methods.has(method)) {
      return this.router.handle(method, view);
    }
    if (this.View.isView(method)) {
      return this.router.all(method);
    }
    if (!this.options.sync) {
      return Promise.resolve(null);
    }
    return view;
  }

  /**
   * Create the "key" to use for caching a view.
   *
   * @param {Object} `view`
   * @return {String} Returns the key.
   * @api public
   */

  renameKey(view) {
    const renameKey = this.option('renameKey');
    if (renameKey) return renameKey.call(this, view);
    if (view.kind === 'partial' || view.kind === 'layout') {
      return view.stem;
    }
    return view.key || view.path;
  }

  invokeOnce(fn) {
    fn.once = fn.once || new Set();
    return function wrap(...args) {
      if (!wrap.called && !fn.once.has(this)) {
        fn.once.add(this);
        wrap.called = true;
        wrap.value = fn.call(this, ...args);
      }
      return wrap.value;
    };
  }

  define(key, value) {
    define(this, key, value);
    return this;
  }

  /**
   * Returns true if the given value is an instance of `View`.
   *
   * @param {Object} `val`
   * @return {Boolean}
   * @api public
   */

  isView(val) {
    return this.View.isView(val);
  }

  /**
   * Get the `View` class to use for creating new views on the collection.
   * @return {Class} `View` Returns the View class.
   * @api public
   */

  get View() {
    return this.options.View || this.constructor.View;
  }

  /**
   * Allow the View class to be customized before creating the instance.
   */

  static set View(val) {
    this._View = val;
  }
  static get View() {
    return this._View || require('./view');
  }
}

function wrap(fn) {
  fn.once = fn.once || new Set();
  return function wrapper(...args) {
    if (!fn.once.has(this)) {
      fn.once.add(this);
      wrapper.value = fn.call(this, ...args);
    }
    return wrapper.value;
  };
}

function pick(obj, arr) {
  if (!obj) return {};
  if (!arr || !arr.length) return obj;
  const res = {};
  for (const key of arr) {
    if (obj[key]) {
      res[key] = obj[key];
      delete obj[key];
    }
  }
  return res;
}

module.exports = Common;
