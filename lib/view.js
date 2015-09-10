'use strict';

var Base = require('base-methods');
var Vinyl = require('vinyl');
var Stream = require('stream');
var cloneStats = require('clone-stats');
var utils = require('./utils');

function View(view) {
  if (!view) view = {};
  if (typeof view.contents === 'string') {
    view.contents = new Buffer(view.contents);
  }

  Vinyl.call(this, view);
  Base.call(this, view);

  for (var key in view) {
    var val = view[key];
    if (key === 'stat' && isObject(val) && val.mode) {
      this.set(key, cloneStats(val));
    } else if (val) {
      this.set(key, val);
    }
  }

  this.define('_contents', null);
  this.define('_content', null);

  utils.syncContents(this, view.contents || view.content);

  this.define('contents', {
    configurable: true,
    enumerable: false,
    get: function () {
      return this._contents;
    },
    set: function (val) {
      utils.syncContents(this, val);
    }
  });

  this.options = this.options || {};
  this.locals = this.locals || {};
  this.data = this.data || {};
}

/**
 * Inherit `Base` and `Vinyl`
 */

Base.extend(View);
Base.inherit(View, Vinyl);

/**
 *
 */

View.prototype.use = function(fn) {
  fn.call(this, this);
  return this;
};

/**
 * Synchronously compile a view.
 *
 * ```js
 * var view = page.compile();
 * view.fn({title: 'A'});
 * view.fn({title: 'B'});
 * view.fn({title: 'C'});
 * ```
 *
 * @param  {Object} `locals` Optionally pass locals to the engine.
 * @return {Object} `View` instance, for chaining.
 * @api public
 */

View.prototype.compile = function (settings) {
  this.fn = utils.engine.compile(this.content, settings);
  return this;
};

/**
 * Asynchronously render a view.
 *
 * ```js
 * view.render({title: 'Home'}, function(err, res) {
 *   //=> view object with rendered `content`
 * });
 * ```
 *
 * @param  {Object} `locals` Optionally pass locals to the engine.
 * @return {Object} `View` instance, for chaining.
 * @api public
 */

View.prototype.render = function (locals, cb) {
  if (typeof locals === 'function') return this.render({}, locals);
  if (typeof this.fn !== 'function') this.compile(locals);

  this.locals = utils.merge({}, this.locals, locals);
  var context = utils.merge({}, this.locals, this.data);
  for (var key in this) {
    if (this.hasOwnProperty(key)) {
      context[key] = context[key] || this[key];
    }
  }

  context.path = this.path;

  utils.engine.render(this.fn, context, function (err, res) {
    if (err) return cb(err);
    this.contents = new Buffer(res);
    cb(null, this);
  }.bind(this));
  return this;
};

/**
 * Re-decorate View methods after calling
 * vinyl's `.clone()` method.
 */

View.prototype.clone = function (opts) {
  opts = opts || {};

  if (typeof opts === 'boolean') {
    opts = {deep: true};
  }

  opts.deep = opts.deep === true;
  opts.contents = opts.contents !== false;

  // clone the instance's view contents
  var contents = this.contents;
  if (this.isStream()) {
    contents = this.contents.pipe(new Stream.PassThrough());
    this.contents = this.contents.pipe(new Stream.PassThrough());
  } else if (this.isBuffer()) {
    contents = opts.contents ? cloneBuffer(this.contents) : this.contents;
  }

  var view = new View({
    cwd: this.cwd,
    base: this.base,
    stat: (this.stat ? cloneStats(this.stat) : null),
    history: this.history.slice(),
    contents: contents
  });

  var ignored = ['_contents', 'stat', 'history', 'path', 'base', 'cwd'];
  for (var key in this) {
    if (ignored.indexOf(key) < 0) {
      utils.define(view, key, opts.deep ? utils.clone(this[key], true) : this[key]);
    }
  }
  return view;
};

/**
 * Override the vinyl `inspect` method.
 */

View.prototype.inspect = function () {
  var inspect = [];

  // use relative path if possible
  var filepath = (this.base && this.path) ? this.relative : this.path;

  if (filepath) {
    inspect.push('"' + filepath + '"');
  }

  if (this.isBuffer()) {
    inspect.push(this.contents.inspect());
  }

  if (this.isStream()) {
    inspect.push(inspectStream(this.contents));
  }
  return '<View ' + inspect.join(' ') + '>';
};

/**
 *
 */

utils.define(View.prototype, 'content', {
  set: function(val) {
    utils.syncContents(this, val);
  },
  get: function() {
    return this._content;
  }
});

/**
 * Ensure that the `layout` property is set on a view.
 */

utils.define(View.prototype, 'layout', {
  set: function (val) {
    this.define('_layout', val);
  },
  get: function () {
    return this._layout || this.data.layout || this.locals.layout || this.options.layout;
  }
});

function inspectStream(stream) {
  var type = stream.constructor.name;
  return '<' + (type !== 'Stream' ? type + 'Stream>' : '');
}

function cloneBuffer(buffer) {
  var res = new Buffer(buffer.length);
  buffer.copy(res);
  return res;
}

function isObject(val) {
  return val && typeof val === 'object';
}

/**
 * Expose `View`
 */

module.exports = View;
