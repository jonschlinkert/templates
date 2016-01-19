'use strict';

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

utils.isItem = utils.isView = function(val) {
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
  if (common.isBuffer(contents)) {
    view._contents = contents;
    view._content = contents.toString();
  }
  if (common.isStream(contents)) {
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
    lazy.extend(ctx, options.hash);
    delete options.hash;
  }
  if (locals.hasOwnProperty('hash')) {
    lazy.extend(ctx, locals.hash);
    delete locals.hash;
  }
  lazy.extend(ctx, options);
  lazy.extend(ctx, locals);
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

utils.resolveLayout = function(view) {
  if (view.options && typeof view.options.resolveLayout === 'function') {
    return view.options.resolveLayout(view);
  }
  if (view.data.layout === null || view.data.layout) {
    return view.data.layout;
  }
  if (view.locals.layout === null || view.locals.layout) {
    return view.locals.layout;
  }
  if (view.options.layout === null || view.options.layout) {
    return view.options.layout;
  }
};
