'use strict';

const use = require('use');
const assert = require('assert');
const Paths = require('./paths');
const engine = require('./engine');
const Emitter = require('./events');
const layouts = require('./layouts');
const resolve = require('./resolve');
const utils = require('./utils');
const sync = require('./sync');
let View = require('./view');

/**
 * This is the base class for both the main "Templates" class, as well
 * as the "Collection" class.
 * @extends {Class} Emitter
 * @param {Object} `options`
 */

class Common extends Emitter {
  constructor(options) {
    super();
    this.ids = new Map();
    this.engines = new Map();
    this.options = { ...options };
    this.cache = { data: {} };
    this.helpers = {};
    this.pathCache = new Paths();
    this.resolveIds = resolve.bind(null, this);
    const { handlers, layoutEngine } = this.options;
    this.layoutEngine = layoutEngine || require('./layouts');
    this.router = new utils.Router({ handlers, sync: this.options.sync });
    this.router.mixin(this);
    this.router.on('handler', (name, handler) => {
      utils.define(this, name, handler.bind(this.router));
    });

    this.engine('layout', layouts.engine());
    this.engine('noop', engine.noop());
    use(this);

    if (typeof this.options.engine === 'string') {
      this.engine.default = this.options.engine;
    }
    if (this.options.sync) {
      this.use(sync);
    }
  }

  getState(name, action, details = {}) {
    return this.state ? { ...this.state } : { name, action, details };
  }

  emitState(...args) {
    this.emit('state', this.getState());
    return this;
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
    if (utils.typeOf(key) === 'object') {
      this.options = { ...this.options, ...key };
      return this;
    }

    if (typeof key !== 'string' || key === '') {
      throw new TypeError('expected "key" to be a string or object');
    }

    if (typeof value === 'undefined') {
      return this.options[key];
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
    if (utils.typeOf(key) === 'object') {
      this.cache.data = { ...this.cache.data, ...key };
      return this;
    }

    if (typeof key !== 'string' || key === '') {
      throw new TypeError('expected "key" to be a string or object');
    }

    if (typeof value === 'undefined') {
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

  view(key, val = {}) {
    if (typeof val === 'string') {
      val = { contents: Buffer.from(val) };
    }

    if (typeof key === 'string') {
      val.key = key;
      val.path = val.path || val.key;
    } else {
      val = key;
      key = null;
    }

    const view = !val.isView ? new this.View(val) : val;
    view.key = key || this.renameKey(view);

    if (this.isCollection) {
      view.collection = this;
      view.kind = this.kind;
    }
    return view;
  }

  /**
   * Register a view engine callback `fn` as `name`.
   *
   * ```js
   * {%= type %}.engine('hbs', require('engine-handlebars'));
   * ```
   * @name .engine
   * @param {String|Array} `exts` String or array of file extensions.
   * @param {Function|Object} `fn` or `settings`
   * @param {Object} `settings` Optionally pass engine options as the last argument.
   * @api public
   */

  engine(name, engine, options = {}) {
    const del = this.engines.delete;
    this.engines.delete = key => {
      if (this.engine.first === key) {
        delete this.engine.engine;
        delete this.engine.first;
      }
      return del.call(this.engines, key);
    }

    if (name && engine) {
      name = utils.dot(name);
      if (this.engines.size === 0 && name !== '.noop') {
        this.engine.engine = engine;
        this.engine.first = name;
        if (engine.instance.helpers && options.reregisterHelpers !== false) {
          this.helper(engine.instance.helpers);
        }
      }
      return this.engines.set(utils.dot(name), engine, options);
    }

    name = utils.dot(name);
    engine = this.engines.get(name) || this.engine.engine;
    assert(engine, `engine "${name}" is not registered`);
    return engine;
  }

  defaultEngine(name) {
    if (this.engine.default) return this.engine.default;
    let names = [utils.dot(name), this.options.engine, this.engine.first].filter(Boolean);
    let engine;

    while (!engine && names.length) {
      engine = this.engines.get(names.shift());
    }

    if (engine) this.engine.default = engine;
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
      for (const key of Object.keys(name)) this.helper(key, name[key]);
      return this;
    }

    if (typeof helper !== 'function') return this.helpers[name];
    const app = this;
    let wrapped = function(...args) {
      if (this && typeof this === 'object') this.app = app;
      return helper.call(this, ...args);
    };

    if (this.options.asyncHelpers === true) {
      wrapped = resolve.wrap(this, name, helper);
    }

    utils.define(wrapped, 'name', name);
    wrapped.helper = helper;
    this.helpers[name] = wrapped;
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

  async renderLayout(view, options, fn) {

    const opts = { ...this.options, ...options };
    const layouts = opts.layouts || (this.kinds && this.kinds.layout);
    const engine = this.engine('layout');

    await this.handle('preLayout', view);

    if (view.layout && layouts) {
      opts.transform = fn;
      opts.layouts = layouts;
      engine.render(view, null, opts);
    }
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

    if (!View.isView(view)) {
      throw new Error('expected a view object');
    }

    if (view.engine === false || view.render === false) return view;
    if (view.fn && options.recompile !== true) return view;
    const opts = { engine: view.engine, ...this.options, ...options };
    const engine = this.mainEngine || this.engine(opts.engine);

    await this.handle('preCompile', view);
    await this.renderLayout(view, options);
    await engine.compile.call(this, view, options);
    await this.handle('postCompile', view);
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

  async render(val, locals, options) {
    const { view, opts, engine, context } = this.prepareRender(val, locals, options);

    if (view.engine === false || view.render === false) return view;
    await this.compile(view, opts);
    await this.handle('preRender', view);
    await engine.render.call(this, view, context, opts);

    // resolve any unresolved async helper IDs
    if (this.options.asyncHelpers === true) {
      view.contents = Buffer.from(String(await this.resolveIds(view.contents.toString())));
    }

    await this.handle('postRender', view);
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

  prepareRender(val, locals = {}, options = {}) {
    const view = this.get(val);

    if (!View.isView(view)) {
      throw new Error(`cannot resolve view: ${val}`);
    }

    if (view.engine === false || view.render === false) return { view };
    const localsOpts = pick(locals, ['helpers', 'layouts', 'partials']);
    const partials = this.cache.partials;
    const defaults = { engine: view.engine, helpers: this.helpers, partials };
    const opts = { ...defaults, ...this.options, ...localsOpts, ...options };
    const engine = this.engine(opts.engine);
    let data = this.cache.data;

    // if the view is on a collection, add data
    // defined on the collection to the context
    if (view.collection && view.collection !== this) {
      data = Object.assign({}, data, view.collection.cache.data);
    }

    // create the context, and add `engine` as a non-enumerable property
    const context = { ...data, ...locals };
    utils.define(context, 'engine', engine);
    return { view, opts, context, engine };
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
   *   .then(view => router.handle('preRender', view))
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
    return Promise.resolve(null);
  }

  /**
   * Create the "key" to use for caching a view.
   *
   * @param {object} `view`
   * @return {string} Returns the key.
   * @api public
   */

  renameKey(view) {
    return this.options.renameKey
      ? this.options.renameKey(view)
      : view.key || view.path;
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
