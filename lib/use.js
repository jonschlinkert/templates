'use strict';

const memo = Symbol('plugins');
const assert = require('assert');
const { define, isObject } = require('./utils');

module.exports = function base(app, config = {}) {
  assert(isObject(app), 'use() expected the first argument to be an object');
  const prop = config.prop || 'fns';
  base.cache = base.cache || new Map();

  if (base.cache.has(app)) return app;
  initialize(app);

  /**
   * Define a plugin function to be passed to use. The only
   * parameter exposed to the plugin is `app`, the object or function.
   * passed to `use(app)`. `app` is also exposed as `this` in plugins.
   *
   * Additionally, **if a plugin returns a function, the function will
   * be pushed onto the `fns` array**, allowing the plugin to be
   * called at a later point by the `run` method.
   *
   * ```js
   * const use = require('use');
   *
   * // define a plugin
   * function foo(app) {
   *   // do stuff
   * }
   *
   * const app = function(){};
   * use(app);
   *
   * // base plugins
   * app.use(foo);
   * app.use(bar);
   * app.use(baz);
   * ```
   * @name .use
   * @param {Function} `fn` plugin function to call
   * @api public
   */

  define(app, 'use', use);
  function use(plugin, options) {
    assert(typeof plugin === 'function', 'expected a function');
    const opts = Object.assign({}, config, options);

    if (opts.once !== false) {
      if (!base.cache.has(this)) base.cache.set(this, new Set());
      const plugins = base.cache.get(this);
      if (plugins.has(plugin)) {
        return this;
      }
      plugins.add(plugin);
    }

    const fn = opts.once !== false ? once(plugin, opts) : plugin;
    const res = fn.call(this, this, options || {});

    // this[prop] will be undefined if `options.decorate` is false
    const fns = this[prop];
    if (!fns) return;

    if (typeof res === 'function') {
      fns.add(res);
    }

    const instances = this[memo];
    if (opts.update !== false && instances.size) {
      for (const ele of instances) {
        use.call(ele, plugin, options);
      }
    }
    return this;
  }

  /**
   * Run all plugins on `fns`. Any plugin that returns a function
   * when called by `use` is pushed onto the `fns` array.
   *
   * ```js
   * const config = {};
   * app.run(config);
   * ```
   * @name .run
   * @param {Object} `value` Object to be modified by plugins.
   * @return {Object} Returns the object passed to `run`
   * @api public
   */

  define(app, 'run', run);
  function run(obj, options = {}) {
    assert(isObject(obj), 'expected an object');
    const opts = Object.assign({}, config, options);
    initialize(obj, options);
    this[memo].add(obj);
    this[prop].forEach(fn => use.call(obj, fn, opts));
    return obj;
  }

  function initialize(obj, options = {}) {
    if (options.decorate !== false && (!obj.use || !obj.run || !obj[prop])) {
      define(obj, memo, obj[memo] || new Set());
      define(obj, prop, obj[prop] || new Set());
    }
    // if (!base.cache.has(obj) && config.cache !== false) {
    //   base.cache.set(obj, new Set());
    // }
  }
};

function once(fn) {
  fn[memo] = fn[memo] || new Set();
  return function wrap(...args) {
    if (!wrap.called && !fn[memo].has(this)) {
      fn[memo].add(this);
      wrap.called = true;
      wrap.value = fn.call(this, ...args);
    }
    return wrap.value;
  };
}
