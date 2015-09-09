'use strict';

var define = require('define-property');
var sortBy = require('array-sort');
var Base = require('base-methods');
var utils = require('./utils');
var Views = require('./views');
var View = require('./view');

function List(options) {
  Base.call(this);
  this.options = options || {};
  utils.renameKey(this);
  utils.option(this);

  this.define('Item', this.options.Item || require('vinyl'));
  this.items = [];
  this.keys = [];

  if (options instanceof Views) {
    this.addItems(options.views);
  }
}

Base.extend(List);

List.prototype.use = function(fn) {
  fn.call(this, this, this.options);
  return this;
};

List.prototype.addItem = function(key, value) {
  if (typeof value !== 'object') {
    throw new TypeError('expected value to be an object.');
  }

  var Item = this.get('Item');
  var item = !(value instanceof Item)
    ? new Item(value)
    : value;

  item.path = item.path || key;
  item.key = this.renameKey(item.key || key);

  item.options = item.options || value.options || {};
  item.locals = item.locals || value.locals || {};
  item.data = item.data || value.data || {};

  item = this.extendItem(item);

  this.emit('item', item.key, item);
  this.keys.push(item.key);
  this.items.push(item);
  return this;
};

List.prototype.addItems = function(items) {
  for (var key in items) this.addItem(key, items[key]);
  return this;
};

List.prototype.addList = function(list, fn) {
  if (typeof fn !== 'function') {
    fn = utils.identity;
  }
  var len = list.length, i = -1;
  while (++i < len) {
    var item = list[i];
    fn(item);
    this.addItem(item.path, item);
  }
  return this;
};

List.prototype.getIndex = function(key) {
  return this.keys.indexOf(this.renameKey(key));
};

List.prototype.getItem = function(key) {
  return this.items[this.getIndex(key)];
};

List.prototype.extendItem = function(item) {
  return item;
};

/**
 * Sort all registered `items` using the given property,
 * properties or compare functions. See [array-sort][]
 * for the full range of available features and options.
 *
 * ```js
 * var list = new List();
 * list.addItems(...);
 * list.sortBy('data.date');
 * ```
 * @return {Object} Returns the `List` instance
 */

List.prototype.sortBy = function() {
  var args = [].slice.call(arguments);
  var last = args[args.length - 1];
  var opts = this.options.sort || {};

  // merge `list.options.sort` global options with local options
  if (last && typeof last === 'object' && !Array.isArray(last)) {
    opts = utils.merge({}, opts, args.pop());
  }

  // create the args to pass to array-sort
  args.unshift(this.items);
  args.push(opts);

  // sort the `items` array
  this.items = sortBy.apply(sortBy, args);
  var len = this.items.length, i = -1;

  // re-sort `keys` based on sorted items
  this.keys = new Array(len);
  while (++i < len) {
    this.keys[i] = this.items[i].key;
  }
  return this;
};


define(List.prototype, 'count', {
  get: function() {
    return this.items.length;
  },
  set: function () {
    throw new Error('count is a read-only getter and cannot be defined.');
  }
});

module.exports = List;
