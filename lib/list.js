'use strict';

var path = require('path');
var plugin = require('./plugins');
var utils = require('./utils');
var Group = require('./group');
var Base = require('./base');

/**
 * Expose `List`
 */

module.exports = List;

/**
 * Create an instance of `List` with the given `options`.
 * Lists differ from collections in that items are stored
 * as an array, allowing items to be paginated, sorted,
 * and grouped.
 *
 * ```js
 * var list = new List();
 * list.addItem('foo', {content: 'bar'});
 * ```
 * @param {Object} `options`
 * @api public
 */

function List(options) {
  if (!(this instanceof List)) {
    return new List(options);
  }

  utils.define(this, 'isCollection', true);
  utils.isName(this, 'List');

  Base.call(this);
  this.init(options || {});
}

/**
 * Inherit `Base`
 */

Base.extend(List);

/**
 * Mixin prototype methods
 */

plugin.routes(List.prototype);
plugin.engine(List.prototype);
plugin.layout(List.prototype);
plugin.render(List.prototype);
plugin.errors(List.prototype, 'List');

/**
 * Initalize `List` defaults
 */

List.prototype.init = function(opts) {
  // decorate the instance
  this.use(plugin.init);
  this.use(plugin.renameKey());
  this.use(plugin.context);
  this.use(plugin.helpers);
  this.use(plugin.item('item', 'Item'));

  // add constructors to the instance
  this.define('Item', opts.Item || require('./view'));
  this.define('Views', opts.Views || require('./views'));

  this.queue = [];
  this.items = [];
  this.keys = [];

  // if an instance of `List` of `Views` is passed, load it now
  if (Array.isArray(opts) || opts.isList) {
    this.options = opts.options || {};
    this.addList(opts.items || opts);

  } else if (opts.isCollection) {
    this.options = opts.options;
    this.addItems(opts.views);

  } else {
    this.options = opts;
  }
};

/**
 * Set an item on the collection. This is identical to [addItem](#addItem)
 * except `setItem` does not emit an event for each item and does not
 * iterate over the item `queue`.
 *
 * ```js
 * collection.setItem('foo', {content: 'bar'});
 * ```
 *
 * @param {String|Object} `key` Item key or object
 * @param {Object} `value` If key is a string, value is the item object.
 * @developer The `item` method is decorated onto the collection using the `item` plugin
 * @return {Object} returns the `item` instance.
 * @api public
 */

List.prototype.setItem = function(key, value) {
  var item = this.item(key, value);

  if (this.options.pager === true) {
    addPager(item, this.items);
  }

  this.keys.push(item.key);
  if (item.use) this.run(item);

  this.emit('load', item);
  this.emit(key, item, this);

  this.items.push(item);
  return item;
};

/**
 * Similar to [setItem](#setItem), adds an item to the list but
 * also fires an event and iterates over the item `queue` to load
 * items from the `addItem` event listener. If the given item is
 * not already an instance of `Item`, it will be converted to one
 * before being added to the `items` object.
 *
 * ```js
 * var items = new Items(...);
 * items.addItem('a.html', {path: 'a.html', contents: '...'});
 * ```
 * @param {String} `key`
 * @param {Object} `value`
 * @return {Object} Returns the instance of the created `Item` to allow chaining item methods.
 * @api public
 */

List.prototype.addItem = function(/*key, value*/) {
  var args = [].slice.call(arguments);
  this.emit.call(this, 'addItem', args);

  var item = this.setItem.apply(this, args);
  while (this.queue.length) {
    this.setItem(this.queue.shift());
  }
  this.extendItem(item);
  return item;
};

/**
 * Load multiple items onto the collection.
 *
 * ```js
 * collection.addItems({
 *   'a.html': {content: '...'},
 *   'b.html': {content: '...'},
 *   'c.html': {content: '...'}
 * });
 * ```
 * @param {Object|Array} `items`
 * @return {Object} returns the instance for chaining
 * @api public
 */

List.prototype.addItems = function(items) {
  if (Array.isArray(items)) {
    return this.addList.apply(this, arguments);
  }

  this.emit('addItems', items);
  if (this.loaded) {
    this.loaded = false;
    return this;
  }

  this.visit('addItem', items);
  return this;
};

/**
 * Load an array of items or the items from another instance of `List`.
 *
 * ```js
 * var foo = new List(...);
 * var bar = new List(...);
 * bar.addList(foo);
 * ```
 * @param {Array} `items` or an instance of `List`
 * @param {Function} `fn` Optional sync callback function that is called on each item.
 * @return {Object} returns the List instance for chaining
 * @api public
 */

List.prototype.addList = function(list, fn) {
  this.emit.call(this, 'addList', list);
  if (this.loaded) {
    this.loaded = false;
    return this;
  }

  if (!Array.isArray(list)) {
    throw new TypeError('expected list to be an array.');
  }

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

/**
 * Return true if the list has the given item (name).
 *
 * ```js
 * list.addItem('foo.html', {content: '...'});
 * list.hasItem('foo.html');
 * //=> true
 * ```
 * @param {String} `key`
 * @return {Object}
 * @api public
 */

List.prototype.hasItem = function(key) {
  return this.getIndex(key) !== -1;
};

/**
 * Get a the index of a specific item from the list by `key`.
 *
 * ```js
 * list.getIndex('foo.html');
 * //=> 1
 * ```
 * @param {String} `key`
 * @return {Object}
 * @api public
 */

List.prototype.getIndex = function(key) {
  if (!key) return null;

  var idx = this.keys.indexOf(this.renameKey(key));
  if (idx !== -1) {
    return idx;
  }

  var items = this.items;
  var len = items.length;

  while (len--) {
    var item = items[len];
    var prop = this.renameKey(key, item);
    if (isMatch(prop, item)) {
      return len;
    }
  }

  function isMatch(key, item) {
    if (key === item.path) return true;
    if (key === item.stem) return true;
    if (key === item.basename) return true;
    if (key === item.relative) return true;
    if (key === item.key) return true;

    var fp = path.resolve(item.path);
    return path.resolve(key) === fp;
  }

  return -1;
};

/**
 * Get a specific item from the list by `key`.
 *
 * ```js
 * list.getItem('foo.html');
 * //=> '<View <foo.html>>'
 * ```
 * @param {String} `key`
 * @return {Object}
 * @api public
 */

List.prototype.getItem = function(key) {
  if (typeof key === 'string') {
    var idx = this.getIndex(key);

    if (idx !== -1) {
      return this.items[idx];
    }
  }
};

/**
 * Proxy for `getItem`
 *
 * ```js
 * list.getItem('foo.html');
 * //=> '<View <foo.html>>'
 * ```
 * @param {String} `key`
 * @return {Object}
 */

List.prototype.getView = function() {
  return this.getItem.apply(this, arguments);
};

/**
 * Remove an item from the list.
 *
 * ```js
 * var list = new List(...);
 * list.addItems({
 *   'a.html': {path: 'a.html', contents: '...'}
 * });
 * ```
 * @param {Object} `items` Object of views
 * @api public
 */

List.prototype.removeItem = function(item) {
  if (utils.isObject(item)) {
    item = item.key;
  }
  item = this.getIndex(item);
  this.items.splice(item, 1);
  this.keys.splice(item, 1);
  return this;
};

/**
 * Decorate each item on the list with additional methods
 * and properties. This provides a way of easily overriding
 * defaults.
 *
 * @param {Object} `item`
 * @return {Object} Instance of item for chaining
 * @api public
 */

List.prototype.extendItem = function(item) {
  plugin.view.all(this, item);
  return this;
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

  // extend `list.options.sort` global options with local options
  if (last && typeof last === 'object' && !Array.isArray(last)) {
    opts = utils.extend({}, opts, args.pop());
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
 * Paginate all `items` in the list with the given options,
 * See [paginationator][] for the full range of available
 * features and options.
 *
 * ```js
 * var list = new List(items);
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
  var items = fn.apply(fn, args);
  return items.pages;
};

/**
 * Add paging (`prev`/`next`) information to the
 * `data` object of an item.
 *
 * @param {Object} `item`
 * @param {Array} `items` instance items.
 */

function addPager(item, items) {
  item.data.pager = {};
  item.data.pager.index = items.length;
  utils.define(item.data.pager, 'current', item);

  if (items.length) {
    var prev = items[items.length - 1];
    utils.define(item.data.pager, 'prev', prev);
    utils.define(prev.data.pager, 'next', item);
  }
}
