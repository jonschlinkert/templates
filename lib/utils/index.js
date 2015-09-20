'use strict';

var path = require('path');

/**
 * Utils
 */

var utils = require('./lazy');

/**
 * Default router methods used in all Template instances
 */

utils.methods = [
  'onLoad',
  'preCompile',
  'preLayout',
  'onLayout',
  'postLayout',
  'onMerge',
  'postCompile',
  'preRender',
  'postRender'
];

/**
 * Options keys
 */

utils.optsKeys = [
  'renameKey',
  'namespaceData',
  'mergePartials',
  'rethrow',
  'nocase',
  'nonull',
  'rename',
  'cwd'
];

/**
 * FILE / GLOB UTILS
 * --------------------------------
 */

/**
 * Resolve the absolute file paths for a glob of files.
 */

utils.resolveGlob = function resolveGlob(patterns, options) {
  var opts = utils.extend({cwd: process.cwd()}, options);
  return utils.globby.sync(patterns, opts).map(function (fp) {
    return path.resolve(opts.cwd, fp);
  });
};

/**
 * Require a glob of files
 */

utils.requireGlob = function requireGlob(patterns, options) {
  var renameKey = function (key) {
    return utils.rename(key, options);
  };

  return utils.resolveGlob(patterns, options).reduce(function (acc, fp) {
    if (/\.(js(?:on)?)/.test(fp)) {
      var key = renameKey(fp);
      acc[key] = utils.tryRequire(fp);
    }
    return acc;
  }, {});
};

/**
 * Require a glob of data
 */

utils.requireData = function requireData(patterns, opts) {
  opts.rename = opts.namespaceData || opts.renameKey || function (key) {
    return path.basename(key, path.extname(key));
  };
  return utils.requireGlob(patterns, opts);
};

/**
 * Attempt to require a file. Fail silently.
 */

utils.tryRequire = function tryRequire(fp, opts) {
  try {
    return require(fp);
  } catch(err) {
    try {
      opts = opts || {};
      fp = path.resolve(fp);
      return require(fp);
    } catch(err) {}
  }
  return null;
};

/**
 * OBJECT / ARRAY / TYPE UTILS
 * --------------------------------
 */

/**
 * Assign own properties from provider to receiver, but only
 * if the receiving object does not already have a value.
 */

utils.defaults = function defaults(target) {
  target = target || {};

  var args = [].slice.call(arguments, 1);
  var len = args.length;
  var i = -1;

  while (++i < len) {
    var obj = args[i];

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        target[key] = target[key] || obj[key];
      }
    }
  }
  return target;
};

utils.defaultsDeep = function defaultsDeep(target) {
  target = target || {};

  var args = [].slice.call(arguments, 1);
  var len = args.length;
  var i = -1;

  while (++i < len) {
    var obj = args[i];

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        var val = obj[key];
        if (utils.isObject(val)) {
          utils.defaultsDeep(target[key], val);
        } else {
          target[key] = target[key] || obj[key];
        }
      }
    }
  }
  return target;
};

/**
 * Assign own properties from provider to receiver, but only
 * if the receiving object does not already have a value.
 */

utils.assign = function assign(target) {
  target = target || {};

  var args = [].slice.call(arguments, 1);
  var len = args.length;
  var i = -1;

  while (++i < len) {
    var obj = args[i];

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        target[key] = obj[key];
      }
    }
  }
  return target;
};

/**
 * Format an error object.
 */

utils.error = function error(msg, val) {
  return new Error(msg + JSON.stringify(val));
};

/**
 * Do nothing.
 */

utils.noop = function noop() {};

/**
 * Return the given value as-is.
 */

utils.identity = function identity(val) {
  return val;
};

/**
 * Arrayify the given value by casting it to an array.
 */

utils.arrayify = function arrayify(val) {
  return Array.isArray(val) ? val : [val];
};

/**
 * Returns true if an array has the given element, or an
 * object has the given key.
 *
 * @return {Boolean}
 */

utils.has = function has(val, key) {
  if (Array.isArray(val)) {
    return val.indexOf(key) > -1;
  }
  return val.hasOwnProperty(key);
};

/**
 * Returns true if an array or object has any of the given keys.
 * @return {Boolean}
 */

utils.hasAny = function hasAny(val, keys) {
  keys = utils.arrayify(keys);
  var len = keys.length;
  while (len--) {
    if (utils.has(val, keys[len])) {
      return true;
    }
  }
  return false;
};

/**
 * Return true if the given value is an object.
 * @return {Boolean}
 */

utils.isObject = function isObject(val) {
  return val && (typeof val === 'function' || typeof val === 'object')
    && !Array.isArray(val);
};

/**
 * Return true if the given value is a stream.
 */

utils.isStream = function isStream(val) {
  return val && (typeof val === 'function' || typeof val === 'object')
    && !Array.isArray(val)
    && (typeof val.pipe === 'function')
    && (typeof val.on === 'function');
};

/**
 * Bind a `thisArg` to all the functions on the target
 *
 * @param  {Object|Array} `target` Object or Array with functions as values that will be bound.
 * @param  {Object} `thisArg` Object to bind to the functions
 * @return {Object|Array} Object or Array with bound functions.
 */

utils.bindAll = function bindAll(target, thisArg) {
  for (var key in target) {
    var fn = target[key];
    if (typeof fn === 'object') {
      target[key] = utils.bindAll(fn, thisArg);
    } else if (typeof fn === 'function') {
      target[key] = fn.bind(thisArg);
      // get `async` flag or any other helper options on `fn`
      for (var k in fn) target[key][k] = fn[k];
    }
  }
  return target;
};

/**
 * VIEW UTILS
 * --------------------------------
 */

/**
 * Singularize the given `name`
 */

utils.single = function single(name) {
  return utils.inflect.singularize(name);
};

/**
 * Pluralize the given `name`
 */

utils.plural = function plural(name) {
  return utils.inflect.pluralize(name);
};

/**
 * Return true if the given value is a view.
 */

utils.isView = function isView(val) {
  if (!utils.isObject(val)) return false;
  return val.hasOwnProperty('content')
    || val.hasOwnProperty('contents')
    || val.hasOwnProperty('path');
};

/**
 * Return the first object with a key that matches
 * the given glob pattern.
 *
 * @param {Object} `object`
 * @param {String|Array} `patterns`
 * @param {Object} `options`
 * @return {Object}
 */

utils.matchKey = function matchKey(obj, patterns, options) {
  if (!utils.isObject(obj)) return null;
  var keys = utils.mm(Object.keys(obj), patterns, options);
  return obj[keys[0]];
};

/**
 * Return all objects with keys that match
 * the given glob pattern.
 *
 * @param {Object} `object`
 * @param {String|Array} `patterns`
 * @param {Object} `options`
 * @return {Object}
 */

utils.matchKeys = function matchKeys(obj, patterns, options) {
  var keys = utils.mm(Object.keys(obj), patterns, options).sort();
  var len = keys.length, i = 0;
  var res = {};

  while (len--) {
    var key = keys[i++];
    res[key] = obj[key];
  }
  return res;
};

/**
 * Resolve the file extension to use for the engine.
 */

utils.resolveEngine = function resolveEngine(view, locals, opts) {
  var engine = locals.engine
    || view.options.engine
    || view.engine
    || view.data.engine
    || (view.data.ext = path.extname(view.path));

  var fn = opts.resolveEngine
    || locals.resolveEngine
    || utils.identity;

  return fn(engine);
};

/**
 * Sync the _content and _contents properties on a view to ensure
 * both are set when setting one.
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
  if (utils.isBuffer(contents)) {
    view._contents = contents;
    view._content = contents.toString();
  }
  if (utils.isStream(contents)) {
    view._contents = contents;
    view._content = contents;
  }
};

/**
 * Rename a file
 */

utils.rename = function rename(fp, opts) {
  opts = opts || {};
  var renameFn = opts.renameFn || opts.rename || utils.identity;
  return renameFn(fp);
};

/**
 * Return true if the given value is a view.
 */

utils.renameKey = function(app) {
  utils.define(app, 'renameKey', function renameKey(key, fn) {
    if (typeof key === 'function') {
      fn = key;
      key = null;
    }

    if (this.option && typeof fn !== 'function') {
      fn = this.option('renameKey');
    }
    if (typeof fn !== 'function') {
      fn = utils.identity;
    }

    this.options = this.options || {};
    this.options.renameKey = fn;
    if (typeof key === 'string') {
      return fn(key);
    }
    return fn;
  }.bind(app));
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

    if (utils.isObject(key) && key.path) {
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
 * Set or get an option value. This is a factory for
 * adding an `option` method to a class
 */

utils.option = function option(app) {
  utils.define(app, 'option', function(key, value) {
    if (typeof key === 'string') {
      if (arguments.length === 1) {
        return this.get('options.' + key);
      }
      this.set('options.' + key, value);
      this.emit('option', key, value);
      return this;
    }
    if (typeof key !== 'object') {
      throw new TypeError('expected a string or object.');
    }
    this.visit('option', key);
    return this;
  }.bind(app));
};

/**
 * Ensure file extensions are formatted properly for lookups.
 *
 * ```js
 * utils.formatExt('hbs');
 * //=> '.hbs'
 *
 * utils.formatExt('.hbs');
 * //=> '.hbs'
 * ```
 *
 * @param {String} `ext` File extension
 * @return {String}
 * @api public
 */

utils.formatExt = function formatExt(ext) {
  if (typeof ext !== 'string') {
    throw new Error('utils.formatExt() expects `ext` to be a string.');
  }
  if (ext.charAt(0) !== '.') {
    return '.' + ext;
  }
  return ext;
};

/**
 * Strip the dot from a file extension
 *
 * ```js
 * utils.stripDot('.hbs');
 * //=> 'hbs'
 * ```
 *
 * @param {String} `ext` extension
 * @return {String}
 * @api public
 */

utils.stripDot = function stripDot(ext) {
  if (typeof ext !== 'string') {
    throw new Error('utils.stripDot() expects `ext` to be a string.');
  }
  if (ext.charAt(0) === '.') {
    return ext.slice(1);
  }
  return ext;
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
    utils.merge(ctx, options.hash);
    delete options.hash;
  }
  if (locals.hasOwnProperty('hash')) {
    utils.merge(ctx, locals.hash);
    delete locals.hash;
  }
  utils.merge(ctx, options);
  utils.merge(ctx, locals);
  return ctx;
};

utils.layoutFn = function layoutFn(view) {
  if (view.options && typeof view.options.layoutFn === 'function') {
    return opts.layoutFn(view);
  }
  return view.data.layout || view.locals.layout || view.options.layout;
};

/**
 * Expose utils
 */

module.exports = utils;
