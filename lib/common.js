'use strict';

const assert = require('assert');
const Emitter = require('events');
const config = require('./config');
const engines = require('./engines');
const layouts = require('./layouts');
const resolve = require('./resolve');
const utils = require('./utils');
const sync = require('./sync');
const { define, first, isObject, stripDot } = utils;
const use = require('use');

/**
 * This is the base class for the main "Templates" (app) class and the "Collection" class.
 * @extends {Class} Emitter
 * @param {Object} `options`
 */

class Common extends Emitter {
  constructor(options = {}) {
    super();
    use(this);

    this.ids = new Map();
    this.engines = new Map();
    this.files = new Map();
    this.config = config;
    this.options = { ...options };
    this.cache = { data: options.data || {} };

    this.helpers = this.options.helpers || {};
    this.resolveIds = resolve.bind(null, this);

    // engine
    this.engine.default = this.options.engine;
    this.engine('layout', layouts.engine(this));
    this.engine('noop', engines.noop());

    // trip the lazy-router getter if handlers are defined
    if (this.options.handlers) this.router;
    if (this.options.sync === true) {
      sync.call(this, this);
    }
  }

  opt(key, options, file) {
    if (options && options[key] !== void 0) return options[key];
    if (file && file[key] !== void 0) return file[key];
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
      return utils.get(this.cache.data, key);
    }

    utils.set(this.cache.data, key, value);
    return this;
  }

  /**
   * Create a new file.
   *
   * ```js
   * {%= type %}.file('/some/template.hbs', {});
   * {%= type %}.file({ path: '/some/template.hbs', contents: Buffer.from('...') });
   * ```
   * @name .file
   * @emits `file`
   * @param {String|object} `key` The file path, or object.
   * @param {Object} `val` File object, when `key` is a path string.
   * @return {Object} Returns the file.
   * @api public
   */

  file(key, file = {}) {
    if (typeof file === 'string') {
      file = { contents: Buffer.from(file) };
    }

    if (typeof key === 'string') {
      file.key = key;
      file.path = file.path || file.key;
    } else {
      file = key;
      key = null;
    }

    file = !this.File.isFile(file) ? new this.File(file) : file;
    if (this.isCollection) {
      file.collection = this;
      file.kind = this.kind;
    }

    file.key = this.renameKey(file);
    this.emit('file', file);
    return file;
  }

  /**
   * Register a file engine callback `fn` as `name`.
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
      return this;
    }

    let name = stripDot(ext);
    if (name === 'base' && typeof engine === 'function') {
      engine = engines.base(new engine());
    }

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
      return this;
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
   * Recursively renders layouts and "nested" layouts on the given `file`.
   *
   * ```js
   * {%= type %}.renderLayout(file);
   * ```
   * @name .renderLayout
   * @param {Object} `file`
   * @param {Object} `options` Optionally pass an object of `layouts`.{% if (type === 'app') { %} Or files from any collections with type "layout" will be used. {% } %}
   * @api public
   */

  async renderLayout(file, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = null;
    }

    let engine = this.engines.get('layout');
    let opts = { ...this.options, ...options };

    if (opts.renderLayout === false || file.renderLayout === false) {
      return file;
    }

    opts.onLayout = fn || opts.onLayout;
    opts.layouts = opts.layouts || (this.kinds && this.kinds.layout) || {};

    await this.handle('preLayout', file);
    await engine.render.call(this, file, null, opts);
    await this.handle('postLayout', file);
    return file;
  }

  /**
   * Compile `file` with the given `options`.
   *
   * ```js
   * let file = {%= type %}.file({ path: 'some-file.hbs', contents: Buffer.from('...') });
   * {%= type %}.compile(file)
   *   .then(file => console.log(file.fn)) //=> [function]
   *
   * // you can call the compiled function more than once
   * // to render the file with different data
   * file.fn({title: 'Foo'});
   * file.fn({title: 'Bar'});
   * file.fn({title: 'Baz'});
   * ```
   *
   * @name .compile
   * @param  {Object|String} `file` File object.
   * @param  {Object} `options`
   * @return {Object} Returns a promise with the file.
   * @api public
   */

  async compile(val, options = {}) {
    let file = this.get(val);
    assert(this.File.isFile(file), `cannot resolve file: ${val}`);

    // exit early
    if (file.render === false || options.render === false) return file;
    let name = first([file.engine, this.options.engine, options.engine]);
    let engine = name ? this.engine(name) : null;
    return this.compileFile(file, engine, options);
  }

  async compileFile(file, engine, options) {
    await this.renderLayout(file, options);
    await this.handle('preCompile', file);
    await engine.compile.call(this, file, options);
    await this.handle('postCompile', file);
    return file;
  }

  /**
   * Prepare a file to be rendered. Gets the file, if `file.path` is defined,
   * creates options and context for the file, and detects the engine to use.
   * The options object will include any layouts, partials, or helpers to
   * pass to the engine.
   *
   * @param {object|string} val File or file.path.
   * @param {object} locals
   * @param {object} options
   * @return {object} Returns an object with `{ file, opts, context, engine }`
   * @api public
   */

  prepareRender(value, locals = {}, options = {}) {
    let file = this.get(value);
    assert(this.File.isFile(file), `could not find file: ${value}`);

    if (!this.opt('render', options, file)) return null;
    if (!this.opt('engine', options, file)) return null;

    let { helpers} = this;
    let localsOpts = pick(locals, ['helpers', 'layouts', 'partials']);
    let opts = { helpers, ...this.options, ...localsOpts, ...options };
    let data = this.cache.data;

    // if the file is on a collection, add data
    // defined on the collection to the context
    if (file.collection && file.collection !== this) {
      data = { ...data, ...file.collection.cache.data };
    }
    return { file, opts, context: { ...data, ...locals } };
  }

  /**
   * Render a file.
   *
   * @param {Object|string} `file` File path or object.
   * @param {Object} `locals` Data to use for rendering the file.
   * @param {Object} options
   * @return {Object}
   * @api public
   */

  async render(file, locals, options) {
    let result = this.prepareRender(file, locals, options);
    if (result === null) return file;
    return this.renderFile(result.file, result.context, result.opts);
  }

  /**
   * Render a file.
   *
   * @param {Object|string} `file` File path or object.
   * @param {Object} `locals` Data to use for rendering the file.
   * @param {Object} options
   * @return {Object}
   * @api public
   */

  async renderFile(file, locals, options) {
    let engine = this.engine(file.engine);
    let data = { engine, ...locals };

    await this.compileFile(file, engine, options);
    await this.handle('preRender', file);
    await engine.render.call(this, file, data, options);

    // resolve any unresolved async helper IDs
    if (this.options.sync !== true && this.options.asyncHelpers === true) {
      file.contents = Buffer.from(String(await this.resolveIds(file.contents.toString())));
    }

    // run "postRender" middleware
    await this.handle('postRender', file);
    return file;
  }

  /**
   * Lazily decorate the Router onto the instance so that
   * it's not loaded when users don't define router methods.
   * This improves intialization and runtime performance.
   */

  get router() {
    let router = this._router;
    if (router) return router;

    let { handlers, sync } = this.options;
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
   * Run middleware `method` on the given `file`.
   *
   * ```js
   * // run a specific method
   * {%= type %}.handle('onLoad', file)
   *   .then(file => console.log('File:', file))
   *   .catch(console.error);
   *
   * // run multiple methods
   * {%= type %}.handle('onLoad', file)
   *   .then(file => app.handle('preRender', file))
   *   .catch(console.error);
   *
   * // run all methods
   * {%= type %}.handle(file)
   *   .then(file => console.log('File:', file))
   *   .catch(console.error);
   * ```
   * @name .handle
   * @param {String} `method` Middleware method to run.
   * @param {Object} `file`
   * @api public
   */

  handle(method, file) {
    if (typeof method === 'string' && this.router.methods.has(method)) {
      return this.router.handle(method, file);
    }
    if (this.File.isFile(method)) {
      return this.router.all(method);
    }
    if (!this.options.sync) {
      return Promise.resolve(null);
    }
    return file;
  }

  /**
   * Create the "key" to use for caching a file.
   *
   * @param {Object} `file`
   * @return {String} Returns the key.
   * @api public
   */

  renameKey(file) {
    let renameKey = this.option('renameKey');
    if (renameKey) return renameKey.call(this, file);
    if (file.kind === 'partial' || file.kind === 'layout') {
      return file.stem;
    }
    return file.key || file.path;
  }

  define(key, value) {
    define(this, key, value);
    return this;
  }

  /**
   * Returns true if the given value is an instance of `File`.
   *
   * @param {Object} `val`
   * @return {Boolean}
   * @api public
   */

  isFile(val) {
    return this.File.isFile(val);
  }

  /**
   * Get the `File` class to use for creating new files on the collection.
   * @return {Class} `File` Returns the File class.
   * @api public
   */

  get File() {
    return this.options.File || this.constructor.File;
  }

  /**
   * Allow the File class to be customized before creating the instance.
   */

  static set File(val) {
    this._File = val;
  }
  static get File() {
    return this._File || require('./file');
  }
}

function pick(obj, arr) {
  if (!obj) return {};
  if (!arr || !arr.length) return obj;
  let res = {};
  for (let key of arr) {
    if (obj[key]) {
      res[key] = obj[key];
      delete obj[key];
    }
  }
  return res;
}

module.exports = Common;
