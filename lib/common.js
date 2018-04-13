'use strict';

const assert = require('assert');
const Emitter = require('@sellside/emitter');
const defaults = require('./defaults');
const resolve = require('./resolve');
const utils = require('./utils');
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
    this.View = this.constructor.View;
    this.cache = { data: {} };
    this.options = { defaults, ...options };
    this.router = new utils.Router(this.options);
    this.engines = new Map();
    this.ids = new Map();
    this.helpers = {};
    this.resolve = resolve.bind(null, this);

    this.router.mixin(this);
    this.router.on('handler', (name, handler) => {
      utils.define(this, name, handler.bind(this.router));
    });
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

    this.options[key] = value;
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
    }

    const view = new this.View(val);
    if (this.isCollection) {
      view.collection = this;
      view.type = this.type;
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

  engine(name, engine) {
    if (!name) name = this.options.engine;
    if (name[0] !== '.') name = '.' + name;
    if (!engine) {
      engine = this.engines.get(name);
      assert(engine, `engine "${name}" is not registered`);
      return engine;
    }
    this.engines.set(name, engine);
    this.emit('engine', name, engine);
    return this;
  }

  /**
   * Register a helper function as `name`.
   *
   * ```js
   * {%= type %}.helper('lowercase', str => str.toLowerCase());
   * ```
   * @name .helper
   * @param {string|object} `name` Helper name or object of helpers.
   * @param {function} `helper` helper function, if name is not an object
   * @api public
   */

  helper(name, helper) {
    if (utils.typeOf(name) === 'object') {
      for (const key of Object.keys(name)) this.helper(key, name[key]);
      return this;
    }
    if (typeof helper !== 'function') return this.helpers[name];
    if (this.options.asyncHelpers === true) {
      this.helpers[name] = resolve.wrap(this, name, helper);
      return this;
    }
    this.helpers[name] = helper;
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
    await this.handle('preLayout', view);

    const opts = { ...this.options, ...options };
    const views = (this.types && this.types.layout) || opts.layouts;

    if (view.layout && views) {
      utils.layouts(view, views, opts, fn);
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

  async compile(val, options) {
    const view = this.get(val);
    if (!View.isView(view)) {
      throw new Error('expected a view object');
    }

    const defaults = { engine: view.engine };
    const opts = { ...defaults, ...this.options, ...options };
    const engine = this.engine(view.engine);

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
    const view = this.get(val);

    if (!View.isView(view)) {
      throw new Error(`cannot resolve view: ${val}`);
    }

    const types = this.types || {};
    const defaults = { engine: view.engine, helpers: this.helpers, partials: types.partial };
    const lopts = pick(locals, ['helpers', 'layouts', 'partials']);
    const opts = { ...defaults, ...this.options, ...lopts, ...options };
    const engine = this.engine(opts.engine);
    let data = this.cache.data;

    // if the view is on a collectiona, add data
    // defined on the collection to the context
    if (view.collection && view.collection !== this) {
      data = { ...data, ...view.collection.cache.data };
    }

    // create the context, and add `engine` as a non-enumerable property
    const context = { ...data, ...locals };
    utils.define(context, 'engine', engine);

    await this.handle('preRender', view);
    await this.compile(view, opts);
    await engine.render.call(this, view, context, opts);

    // resolve any unresolved async helper IDs
    if (this.options.asyncHelpers === true) {
      view.contents = Buffer.from(String(await this.resolve(view.contents.toString())));
    }

    await this.handle('postRender', view);
    return view;
  }

  /**
   * Add one or more middleware handler methods. Handler methods may also be
   * added by passing an array of handler names to the constructor on the
   * `handlers` option.
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

  async handle(method, view) {
    if (typeof method === 'string' && this.router.methods.has(method)) {
      return await this.router.handle(method, view);
    }
    if (View.isView(method)) {
      return await this.router.all(method);
    }
  }

  /**
   * Create the "key" to use for caching a view.
   *
   * @param {object} `view`
   * @return {string} Returns the key.
   * @api public
   */

  renameKey(view) {
    return this.options.renameKey ? this.options.renameKey(view) : view.path;
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
