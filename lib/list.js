'use strict';

var Base = require('base-methods');
var utils = require('./utils');
var Group = require('./group');

function List(options) {
  Base.call(this);
  this.options = options || {};
  utils.renameKey(this);
  utils.option(this);

  this.define('Views', this.options.Views || require('./views'));
  this.define('Item', this.options.Item || require('./view'));
  this.items = [];
  this.keys = [];

  if (options instanceof this.Views) {
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
 * Group all list `items` using the given property,
 * properties or compare functions. See [group-array][]
 * for the full range of available features and options.
 *
 * ```js
 * var list = new List();
 * list.addItems(...);
 * var groups = list.groupBy('data.date', 'data.slug');
 * ```
 * @return {Object} Returns the grouped items.
 * @api public
 */

List.prototype.groupBy = function() {
  var args = [].slice.call(arguments);
  var fn = utils.groupBy;

  // Make `items` the first argument for group-array
  args.unshift(this.items.slice());

  // group the `items` and return the result
  return new Group(fn.apply(fn, args));
};

/**
 * Sort all list `items` using the given property,
 * properties or compare functions. See [array-sort][]
 * for the full range of available features and options.
 *
 * ```js
 * var list = new List();
 * list.addItems(...);
 * var result = list.sortBy('data.date');
 * //=> new sorted list
 * ```
 * @return {Object} Returns a new `List` instance with sorted items.
 * @api public
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
  args.unshift(this.items.slice());
  args.push(opts);

  // sort the `items` array, then sort `keys`
  var items = utils.sortBy.apply(utils.sortBy, args);
  var list = new List(this.options);
  list.addItems(items);
  return list;
};

/**
 * Paginate all list `items` with the given options,
 * See [paginationator][] for the full range of available features and options.
 *
 * ```js
 * var list = new List();
 * list.addItems(...);
 * var pages = list.paginate({limit: 5});
 * ```
 * @return {Object} Returns the paginated items.
 * @api public
 */

List.prototype.paginate = function() {
  var args = [].slice.call(arguments);
  var fn = utils.paginationator;

  // Make `items` the first argument for paginationator
  args.unshift(this.items.slice());

  // paginate the `items` and return the pages
  return fn.apply(fn, args).pages;
};

utils.define(List.prototype, 'count', {
  get: function() {
    return this.items.length;
  },
  set: function () {
    throw new Error('count is a read-only getter and cannot be defined.');
  }
});

/**
 * Expose `List`
 */

module.exports = List;
