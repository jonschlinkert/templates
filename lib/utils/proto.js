'use strict';

var path = require('path');
var common = require('./common');
var lazy = require('./lazy');

/**
 * Expose view and collection utils
 */

var utils = module.exports;

/**
 * Return true if the given value looks like a
 * `view` object.
 */

utils.isItem = utils.isView = function isView(val) {
  if (!common.isObject(val)) return false;
  return val.hasOwnProperty('content')
    || val.hasOwnProperty('contents')
    || val.hasOwnProperty('path');
};

/**
 * Sync the _content and _contents properties on a view to ensure
 * both are set when setting either.
 *
 * @param {Object} `view` instance of a `View`
 * @param {String|Buffer|Stream|null} `contents` contents to set on both properties
 */

utils.syncContents = function syncContents(view, contents) {
  if (contents === null) {
    view._contents = null;
    view._content = null;
  }
  if (typeof contents === 'string') {
    view._contents = new Buffer(contents);
    view._content = contents;
  }
  if (lazy.isBuffer(contents)) {
    view._contents = contents;
    view._content = contents.toString();
  }
  if (common.isStream(contents)) {
    view._contents = contents;
    view._content = contents;
  }
};

/**
 * Decorate a `view` method onto the given `app` object.
 *
 * @param {Object} app
 */

utils.itemFactory = function (app, method, CtorName) {
  app.define(method, function(key, value) {
    if (typeof value !== 'object' && typeof key === 'string') {
      return this[method](this.renameKey(key), {path: key});
    }

    if (common.isObject(key) && key.path) {
      return this[method](key.path, key);
    }

    if (typeof value !== 'object') {
      throw new TypeError('expected value to be an object.');
    }

    var Item = this.get(CtorName);
    var item = !(value instanceof Item)
      ? new Item(value)
      : value;

    item.options = item.options || value.options || {};
    item.locals = item.locals || value.locals || {};
    item.data = item.data || value.data || {};

    // get renameKey fn if defined on item opts
    if (item.options && item.options.renameKey) {
      this.option('renameKey', item.options.renameKey);
    }

    item.key = this.renameKey(item.key || key);
    item.path = item.path || key;

    this.plugins.forEach(function (fn) {
      item.use(fn);
    });

    this.emit(method, item, this);
    return item;
  });
};

/**
 * Get locals from helper arguments.
 *
 * @param  {Object} `locals`
 * @param  {Object} `options`
 */

utils.getLocals = function getLocals(locals, options) {
  options = options || {};
  locals = locals || {};
  var ctx = {};

  if (options.hasOwnProperty('hash')) {
    lazy.merge(ctx, options.hash);
    delete options.hash;
  }
  if (locals.hasOwnProperty('hash')) {
    lazy.merge(ctx, locals.hash);
    delete locals.hash;
  }
  lazy.merge(ctx, options);
  lazy.merge(ctx, locals);
  return ctx;
};

/**
 * Resolve the name of the engine to use, or the file
 * extension to use for the engine.
 *
 * If `options.resolveEngine` is a function, it will be
 * used to resolve the engine.
 *
 * @param {Object} `view`
 * @param {Object} `locals`
 * @param {Object} `opts`
 * @return {String}
 */

utils.resolveEngine = function resolveEngine(view, locals, opts) {
  var engine = locals.engine
    || opts.engine
    || view.options.engine
    || view.engine
    || view.data.engine
    || (view.data.ext = path.extname(view.path));

  var fn = opts.resolveEngine
    || locals.resolveEngine
    || common.identity;
  return fn(engine);
};

/**
 * Resolve the layout to use for `view`. If `options.resolveLayout` is
 * a function, it will be used instead.
 *
 * @param {Object} `view`
 * @return {String|undefined} The name of the layout or `undefined`
 * @api public
 */

utils.resolveLayout = function resolveLayout(view) {
  if (view.options && typeof view.options.resolveLayout === 'function') {
    return view.options.resolveLayout(view);
  }
  return view.data.layout || view.locals.layout || view.options.layout;
};
