'use strict';

var fs = require('fs');
var utils = require('lazy-cache')(require);
var fn = require;
require = utils; // eslint-disable-line

/**
 * Plugins for [base](https://github.com/node-base/base)
 */

require('base-data');
require('base-option', 'option');
require('base-plugins', 'plugin');

/**
 * Common utils
 */

require('array-sort', 'sortBy');
require('async-each', 'each');
require('clone');
require('clone-stats');
require('deep-bind', 'bindAll');
require('define-property', 'define');
require('extend-shallow', 'extend');
require('falsey', 'isFalsey');
require('get-value', 'get');
require('get-view');
require('group-array', 'groupBy');
require('has-glob');
require('has-value', 'has');
require('match-file');
require('mixin-deep', 'merge');
require('paginationator');
require('pascalcase', 'pascal');
require('set-value', 'set');

/**
 * Middleware and routes
 */

require('en-route', 'router');

/**
 * Engines, templates, helpers and related utils
 */

require('engine-base', 'engine');
require('engine-cache', 'Engines');
require('inflection', 'inflect');
require('layouts');
require('load-helpers', 'loader');
require('template-error', 'rethrow');
require = fn; // eslint-disable-line

/**
 * Expose default router methods used in all Template instances
 */

utils.methods = [
  'onLoad',
  'preCompile',
  'preLayout',
  'onLayout',
  'postLayout',
  'onMerge',
  'onStream',
  'postCompile',
  'preRender',
  'postRender',
  'preWrite',
  'postWrite'
];

utils.constructorKeys = [
  'Collection',
  'Group',
  'Item',
  'List',
  'View',
  'Views'
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

utils.endsWith = function(str, sub) {
  return str.slice(-sub.length) === sub;
};

/**
 * Return true if file exists and is not a directory.
 */

utils.fileExists = function(filepath) {
  try {
    return fs.statSync(filepath).isDirectory() === false;
  } catch (err) {}
  return false;
};

/**
 * Keep a history of engines used to compile a view, and
 * the compiled function for each, allowing the compiled
 * function to be used again the next time the same view
 * is rendered by the same engine.
 *
 * @param {Object} view
 * @param {String} engine
 * @param {Function} fn
 */

utils.engineStack = function(view, engine, fn, content) {
  if (typeof view.engineStack === 'undefined') {
    view.engineStack = {};
  }
  if (engine && engine.charAt(0) !== '.') {
    engine = '.' + engine;
  }
  view.engineStack[engine] = fn;
  view.engineStack[engine].content = content;
};

/**
 * Return true if a template is a partial
 */

utils.isPartial = function(view) {
  if (typeof view.isType !== 'function') {
    return false;
  }
  if (typeof view.options === 'undefined') {
    return false;
  }
  if (typeof view.options.viewType === 'undefined') {
    return false;
  }
  return view.isType('partial');
};

/**
 * Return true if a template is renderable, and not a partial or layout
 */

utils.isRenderable = function(view) {
  if (typeof view.isType !== 'function') {
    return false;
  }
  if (typeof view.options === 'undefined') {
    return false;
  }
  if (typeof view.options.viewType === 'undefined') {
    return false;
  }
  return view.isType('renderable') && view.viewType.length === 1;
};

/**
 * When a constructor is defined after init, update any underlying
 * properties that may rely on that option (constructor).
 */

utils.updateOptions = function(app, key, value) {
  var k = utils.constructorKeys;
  if (k.indexOf(key) > -1) {
    app.define(key, value);
  }
  if (key === 'layout') {
    app.viewTypes.renderable.forEach(function(name) {
      app[name].option('layout', value);
    });
  }
};

/**
 * Return the given value as-is.
 */

utils.identity = function(val) {
  return val;
};

/**
 * Return true if the given value is a buffer
 */

utils.isBuffer = function(val) {
  if (val && val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
};

/**
 * Arrayify the given value by casting it to an array.
 */

utils.arrayify = function(val) {
  if (typeof val === 'undefined' || val === null || val === '') {
    return [];
  }
  return Array.isArray(val) ? val : [val];
};

/**
 * Return the last element in an array or array-like object.
 */

utils.last = function(array, n) {
  return array[array.length - (n || 1)];
};

/**
 * Return true if the given value is an object.
 * @return {Boolean}
 */

utils.isObject = function(val) {
  if (!val || Array.isArray(val)) {
    return false;
  }
  return typeof val === 'function'
    || typeof val === 'object';
};

/**
 * Return true if the given value is a stream.
 */

utils.isStream = function(val) {
  return utils.isObject(val)
    && (typeof val.pipe === 'function')
    && (typeof val.on === 'function');
};

/**
 * Assign own properties from provider to receiver, but only
 * if the receiving object does not already have a value.
 */

utils.defaults = function(target) {
  var args = [].slice.call(arguments, 1);
  var len = args.length;
  var i = -1;

  while (++i < len) {
    var obj = args[i];

    for (var key in obj) {
      target[key] = target[key] || obj[key];
    }
  }
  return target;
};

/**
 * Return true if the given value is an object.
 * @return {Boolean}
 */

utils.isOptions = function(val) {
  return utils.isObject(val) && val.hasOwnProperty('hash');
};

/**
 * Format a helper error.
 * TODO: create an error class for helpers
 */

utils.helperError = function(app, helperName, viewName, cb) {
  var err = new Error('helper "' + helperName + '" cannot find "' + viewName + '"');
  app.emit('error', err);
  if (typeof cb === 'function') {
    return cb(err);
  } else {
    throw err;
  }
};

/**
 * Convenience method for setting `this.isFoo` and `this._name = 'Foo'
 * on the given `app`
 */

utils.setInstanceNames = function setInstanceNames(app, name) {
  utils.define(app, 'is' + utils.pascal(name), true);
  utils.define(app, '_name', name);
};

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
 * Return true if the given value looks like a
 * `view` object.
 */

utils.isItem = utils.isView = function(val) {
  if (!utils.isObject(val)) return false;
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

utils.syncContents = function(view, contents) {
  if (typeof view._contents === 'undefined') {
    view.define('_contents', null);
    view.define('_content', null);
  }
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
 * Get locals from helper arguments.
 *
 * @param  {Object} `locals`
 * @param  {Object} `options`
 */

utils.getLocals = function(locals, options) {
  options = options || {};
  locals = locals || {};
  var ctx = {};

  if (options.hasOwnProperty('hash')) {
    utils.extend(ctx, options.hash);
    delete options.hash;
  }
  if (locals.hasOwnProperty('hash')) {
    utils.extend(ctx, locals.hash);
    delete locals.hash;
  }
  utils.extend(ctx, options);
  utils.extend(ctx, locals);
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

utils.resolveEngine = function(view, locals, opts) {
  var engine = locals.engine || view.engine || opts.engine;
  var fn = opts.resolveEngine
    || locals.resolveEngine
    || utils.identity;
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

utils.resolveLayout = function(view) {
  var layout;
  if (view.options && typeof view.options.resolveLayout === 'function') {
    layout = view.options.resolveLayout(view);
  } else {
    if (typeof layout === 'undefined') {
      layout = view.data.layout;
    }
    if (typeof layout === 'undefined') {
      layout = view.locals.layout;
    }
    if (typeof layout === 'undefined') {
      layout = view.options.layout;
    }
    if (view.isPartial && layout === 'default') {
      layout = undefined;
    }
  }
  return layout;
};

/**
 * Expose utils
 */

module.exports = utils;
