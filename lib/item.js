'use strict';

var Base = require('base');
var Vinyl = require('vinyl');
var Stream = require('stream');
var cloneStats = require('clone-stats');
var debug = require('./debug');
var utils = require('./utils');

/**
 * Expose `Item`
 */

module.exports = Item;

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
  if (!(this instanceof Item)) {
    return new Item(item);
  }

  item = item || {};
  utils.syncContents(this, item.contents || item.content);
  this.options = item.options || {};
  this.locals = item.locals || {};
  this.data = item.data || {};

  this.define('contents', {
    configurable: true,
    enumerable: false,
    get: function() {
      return this._contents;
    },
    set: function(val) {
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

  this.is('Item');
  debug(this);
  this.use(utils.option());
  this.use(utils.plugin());
}

/**
 * Inherit `Base` and `Vinyl`
 */

Base.extend(Item);
Base.inherit(Item, Vinyl);

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

Item.prototype.clone = function(opts) {
  opts = opts || {};

  if (typeof opts === 'boolean') {
    opts = { deep: true };
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

  var ignored = ['_contents', 'stat', 'history', 'path', 'base', 'cwd', 'options', 'data'];
  for (var key in this) {
    if (ignored.indexOf(key) < 0) {
      utils.define(item, key, opts.deep ? utils.clone(this[key], true) : this[key]);
    }
  }

  if (opts.deep !== true) {
    item.options = this.options;
    item.data = this.data;
  } else {
    item.options = utils.extend({}, this.options);
    item.data = utils.extend({}, this.data);
  }
  return item;
};

/**
 * Override the vinyl `inspect` method.
 */

Item.prototype.inspect = function() {
  var name = this._name.charAt(0).toUpperCase() + this._name.slice(1);
  var inspect = [];

  var fp = (this.path && this.base)
    ? this.relative
    : (this.key || this.path);

  if (fp) inspect.push('"' + fp + '"');

  if (this.isBuffer()) {
    inspect.push(this.contents.inspect());
  }

  if (this.isStream()) {
    inspect.push(inspectStream(this.contents));
  }
  return '<' + name + ' ' + inspect.join(' ') + '>';
};

/**
 * Expose `filename` as an alias for `stem`
 */

utils.define(Item.prototype, 'filename', {
  set: function(val) {
    this.stem = val;
  },
  get: function() {
    return this.stem;
  }
});

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
  var name = stream.constructor.name;
  if (!endsWith(name, 'Stream')) {
    name += 'Stream';
  }
  return '<' + name + '>';
}

function endsWith(str, sub) {
  return str.slice(-sub.length) === sub;
}

function cloneBuffer(buffer) {
  var res = new Buffer(buffer.length);
  buffer.copy(res);
  return res;
}

function isObject(val) {
  return val && typeof val === 'object';
}
