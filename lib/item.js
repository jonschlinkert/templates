'use strict';

var Vinyl = require('vinyl');
var Stream = require('stream');
var Base = require('base-methods');
var cloneStats = require('clone-stats');
var decorate = require('./decorate');
var utils = require('./utils/');

/**
 * Create an instance of `Item`. Optionally pass a default object
 * to use.
 *
 * ```js
 * var item = new Item({
 *   path: 'foo.html',
 *   content: '...'
 * });
 * ```
 * @param {Object} `item`
 * @api public
 */

function Item(item) {
  this.isItem = true;

  item = item || {};
  utils.syncContents(this, item.contents || item.content);
  this.options = item.options || {};
  this.locals = item.locals || {};
  this.data = item.data || {};

  this.define('_name', 'Item');
  this.define('_contents', null);
  this.define('_content', null);
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

  Vinyl.call(this, item);
  Base.call(this, item);

  for (var key in item) {
    var val = item[key];
    if (key === 'stat' && isObject(val) && val.mode) {
      this.set(key, cloneStats(val));
    } else if (val) {
      this.set(key, val);
    }
  }
}

/**
 * Inherit `Base` and `Vinyl`
 */

Base.extend(Item);
Base.inherit(Item, Vinyl);
decorate.config(Item.prototype);

/**
 * Run a plugin on the `item` instance.
 *
 * ```js
 * var item = new Item({path: 'abc', contents: '...'})
 *   .use(require('foo'))
 *   .use(require('bar'))
 *   .use(require('baz'))
 * ```
 * @param {Function} `fn`
 * @return {Object}
 * @api public
 */

Item.prototype.use = function(fn) {
  fn.call(this, this);
  this.emit('use');
  return this;
};

/**
 * Re-decorate Item methods after calling
 * vinyl's `.clone()` method.
 *
 * ```js
 * item.clone({deep: true}); // false by default
 * ```
 * @param  {Object} `options`
 * @return {Object} `item` Cloned instance
 * @api public
 */

Item.prototype.clone = function (opts) {
  opts = opts || {};

  if (typeof opts === 'boolean') {
    opts = {deep: true};
  }

  opts.deep = opts.deep === true;
  opts.contents = opts.contents !== false;

  // clone the instance's item contents
  var contents = this.contents;
  if (this.isStream()) {
    contents = this.contents.pipe(new Stream.PassThrough());
    this.contents = this.contents.pipe(new Stream.PassThrough());
  } else if (this.isBuffer()) {
    contents = opts.contents ? cloneBuffer(this.contents) : this.contents;
  }

  var item = new Item({
    cwd: this.cwd,
    base: this.base,
    stat: (this.stat ? cloneStats(this.stat) : null),
    history: this.history.slice(),
    contents: contents
  });

  var ignored = ['_contents', 'stat', 'history', 'path', 'base', 'cwd'];
  for (var key in this) {
    if (ignored.indexOf(key) < 0) {
      utils.define(item, key, opts.deep ? utils.clone(this[key], true) : this[key]);
    }
  }
  return item;
};

/**
 * Override the vinyl `inspect` method.
 */

Item.prototype.inspect = function () {
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
  return '<' + this._name + ' ' + inspect.join(' ') + '>';
};

/**
 * Normalize the `content` and contents` properties on `item`.
 * This is done to ensure compatibility with the vinyl standard
 * of using `contents` as a Buffer, as well as the assemble
 * standard of using `content` as a string.
 */

utils.define(Item.prototype, 'content', {
  set: function(val) {
    utils.syncContents(this, val);
  },
  get: function() {
    return this._content;
  }
});

/**
 * Utils
 */

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
 * Expose `Item`
 */

module.exports = Item;
