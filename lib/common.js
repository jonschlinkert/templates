'use strict';

const assert = require('assert');
const Emitter = require('events');
const config = require('./config');
const engines = require('./engines');
const layouts = require('./layouts');
const utils = require('./utils');
let View = require('./view');

/**
 * This is the base class for both the main "Templates" class, as well
 * as the "Collection" class.
 * @extends {Class} Emitter
 * @param {Object} `options`
 */

class Common extends Emitter {
  constructor(options = {}) {
    super();
    this.fns = new Set();
    this.ids = new Map();
    this.engines = new Map();
    this.views = new Map();
    this.config = config;
    this.options = { sync: true, ...options };
    this.cache = { data: options.data || {} };

    this.helpers = this.options.helpers || {};

    // engine
    this.engine.default = this.options.engine;
    this.engine('layout', layouts.engine());
    this.engine('noop', engines.noop());

    // trip the lazy router getter if handlers are defined
    if (this.options.handlers) {
      this.router;
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
   * @param {string|object} `key`
   * @param {object} `val`
   * @return {object} Returns the instance when setting, or the value when getting.
   * @api public
   */

  option(key, value) {
    if (utils.isObject(key)) {
      this.options = { ...this.options, ...key };
      return this;
    }

    if (typeof key !== 'string' || key === '') {
      throw new TypeError('expected "key" to be a string or object');
    }

    if (value === void 0) {
      return this.config.get(key, this.options[key]);
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
   * @param {string|object} `key`
   * @param {object} `val`
   * @return {object} Returns the instance when setting, or the value when getting.
   * @api public
   */

  data(key, value) {
    if (utils.isObject(key)) {
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
   * @param {string|object} `key` The view path, or object.
   * @param {object} `val` View object, when `key` is a path string.
   * @return {object} Returns the view.
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

    view = !View.isView(view) ? new View(view) : view;
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
   * @param {string|array} `exts` String or array of file extensions.
   * @param {object|function} `engine` Engine object or function.
   * @param {object} `settings` Optionally pass engine options as the last argument.
   * @return {object} Returns the given or cached engine.
   * @api public
   */

  engine(ext, engine) {
    if (Array.isArray(ext)) {
      ext.forEach(n => this.engine(n, engine));
      return engine;
    }

    const name = utils.stripDot(ext);
    if (name && engine) {
      if (typeof engine === 'function') {
        engine = { ...this.engines.get('noop'), render: engine };
        engine.name = name;
      }
      engine.name = engine.name || name;
      this.engines.set(name, engine);
      return engine;
    }

    engine = name ? this.engines.get(name) : null;

    if (!engine && name !== false) {
      engine = this.engines.get(utils.stripDot(this.options.engine));
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
   * @param {string|object} `name` Helper name or object of helpers.
   * @param {function} `helper` helper function, if name is not an object
   * @api public
   */

  helper(name, helper) {
    if (utils.isObject(name)) {
      for (const key of Object.keys(name)) {
        this.helper(key, name[key]);
      }
      return this;
    }

    if (typeof helper !== 'function') {
      return this.helpers[name];
    }

    const app = this;
    let wrapped = function(...args) {
      if (this && typeof this === 'object') this.app = app;
      return helper.call(this, ...args);
    };

    utils.define(wrapped, 'name', name);
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
   * @param {object} `view`
   * @param {object} `options` Optionally pass an object of `layouts`.{% if (type === 'app') { %} Or views from any collections with type "layout" will be used. {% } %}
   * @api public
   */

  renderLayout(view, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = null;
    }

    if (this.opt('renderLayout', options, view) === false) return view;
    if (view.layout) {
      const engine = this.engine('layout');
      this.handle('preLayout', view);
      const opts = { ...this.options, ...options };
      opts.onLayout = fn || opts.onLayout;
      opts.layouts = opts.layouts || (this.kinds && this.kinds.layout) || {};
      engine.render.call(this, view, null, opts);
      this.handle('postLayout', view);
    }
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

  compile(val, options = {}) {
    const view = this.get(val);
    assert(View.isView(view), `cannot resolve view: ${val}`);

    // exit early
    if (!this.opt('render', options, view)) return view;
    if (!this.opt('engine', options, view)) return view;
    if (view.fn && this.opt('recompile', options, view) !== true) return view;
    const engine = this.engine(view.engine);
    return this.compileView(view, engine, options);
  }

  compileView(view, engine, options) {
    this.renderLayout(view, options);
    this.handle('preCompile', view);
    engine.compile.call(this, view, options);
    this.handle('postCompile', view);
    return view;
  }

  /**
   * Render a view.
   *
   * @param {object|string} `view` View path or object.
   * @param {object} `locals` Data to use for rendering the view.
   * @param {object} options
   * @return {object}
   * @api public
   */

  render(view, locals, options) {
    view = this.get(view);
    assert(View.isView(view), `expected a view: ${view}`);

    // return early if possible
    if (!this.opt('render', options, view)) return view;
    if (!this.opt('engine', options, view)) return view;

    const { helpers } = this;
    const localsOptions = pick(locals, ['helpers', 'layouts', 'partials']);
    const engineOptions = { helpers, ...this.options, ...localsOptions, ...options };
    let data = this.cache.data;

    // if the view is on a collection, add data
    // defined on the collection to the context
    if (view.collection && view.collection !== this) {
      data = { ...data, ...view.collection.cache.data };
    }

    return this.renderView(view, { ...data, ...locals }, engineOptions);
  }

  /**
   * Render a view.
   *
   * @param {object|string} `view` View path or object.
   * @param {object} `locals` Data to use for rendering the view.
   * @param {object} options
   * @return {object}
   * @api public
   */

  renderView(view, locals = {}, options) {
    this.compile(view, options);
    this.handle('preRender', view);
    const engine = locals.engine = this.engine(view.engine);
    engine.render.call(this, view, locals, options);
    this.handle('postRender', view);
    return view;
  }

  context(locals) {

  }

  /**
   * Lazily decorate the Router onto the instance so that it's not
   * loaded when users don't define router methods, which improves
   * intialization and runtime performance.
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
   * @param {string|array} `methods` Method names
   * @param {object} `options`
   * @return {object} Returns the instance for chaining.
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
   * @param {string} `method` Middleware method to run.
   * @param {object} `view`
   * @api public
   */

  handle(method, view) {
    if (typeof method === 'string' && this.router.methods.has(method)) {
      return this.router.handle(method, view);
    }
    if (View.isView(method)) {
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
   * @param {object} `view`
   * @return {string} Returns the key.
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

  define(key, value) {
    utils.define(this, key, value);
    return this;
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

  /**
   * Returns true if the given value is an instance of `View`.
   *
   * @param {object} `val`
   * @return {boolean}
   * @api public
   */

  isView(val) {
    return this.View.isView(val);
  }

  get View() {
    return this.constructor.View;
  }

  /**
   * Allow the View class to be customized before creating the instance.
   */

  static set View(val) {
    View = val;
  }
  static get View() {
    return View;
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
