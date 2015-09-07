'use strict';

var clone = require('clone');
var Vinyl = require('vinyl');
var cloneStats = require('clone-stats');
var define = require('define-property');
var engine = require('engine-lodash');
var Base = require('base-methods');
var Stream = require('stream');
var utils = require('./utils')(require);
var inherit = require('./inherit');

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
  if (!this.options) {
    this.options = {};
  }
  if (!this.locals) {
    this.locals = {};
  }
  if (!this.data) {
    this.data = {};
  }
}

Base.extend(View);
inherit(View, Vinyl);

/**
 *
 */

View.prototype.use = function(fn) {
  fn(this);
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

View.prototype.compile = function (options) {
  this.fn = engine.compile(this.contents.toString(), options);
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
  var contents = this.fn || this.contents.toString();
  var context = utils.merge({}, this.data, this.locals, locals);
  engine.render(contents, context, function (err, res) {
    if (res instanceof Error) {
      err = res;
    }
    if (err) return cb(err);
    this.contents = new Buffer(res);
    cb(null, this);
  }.bind(this));
  return this;
};

View.prototype.context = function(locals) {
  return utils.merge({}, this.locals, this.data, locals);
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
  var contents;
  if (this.isStream()) {
    contents = this.contents.pipe(new Stream.PassThrough());
    this.contents = this.contents.pipe(new Stream.PassThrough());
  } else if (this.isBuffer()) {
    contents = opts.contents ? cloneBuffer(this.contents) : this.contents;
  } else if (this.isNull()) {
    contents = null;
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
      define(view, key, opts.deep ? clone(this[key], true) : this[key]);
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
 * Ensure that the `layout` property is set on a view.
 */

define(View.prototype, 'layout', {
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
