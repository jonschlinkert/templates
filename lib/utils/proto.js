'use strict';

var utils = require('./common');
var lazy = require('./lazy');

/**
 * Return true if the given value looks like a
 * `view` object.
 */

exports.isItem = exports.isView = function(val) {
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

exports.syncContents = function(view, contents) {
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

exports.getLocals = function(locals, options) {
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

exports.resolveEngine = function(view, locals, opts) {
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

exports.resolveLayout = function(view) {
  var layout;
  if (view.options && typeof view.options.resolveLayout === 'function') {
    layout = view.options.resolveLayout(view);
  } else {
    layout = syncLayout(layout, view, 'data');
    layout = syncLayout(layout, view, 'locals');
    layout = syncLayout(layout, view, 'options');
  }
  return layout;
};

function syncLayout(layout, view, prop) {
  var obj = view[prop];
  if (typeof obj.layout !== 'string' && typeof obj.layout !== 'boolean' && obj.layout !== null) {
    return layout;
  }
  if (typeof layout === 'undefined') {
    layout = obj.layout;
  }
  if (view.isPartial && layout === 'default') {
    layout = null;
  }
  return layout;
}
