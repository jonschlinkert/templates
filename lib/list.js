'use strict';

var Base = require('base-methods');
var utils = require('./utils');
var Group = require('./group');

function List(options) {
  Base.call(this);
  options = options || {};

  // decorate the instance
  utils.createView(this);
  utils.renameKey(this);
  utils.option(this);

  // add constructors to the instance
  this.define('Views', options.Views || require('./views'));
  this.define('Item', options.Item || require('./view'));

  this.isList = true;
  this.plugins = [];
  this.items = [];
  this.keys = [];

  // if an instance of `List` of `Views` is passed, load it now
  if (Array.isArray(options) || options instanceof List) {
    this.options = options.options || {};
    this.addList(options.items || options);

  } else if (options instanceof this.Views) {
    this.options = options.options || {};
    this.addItems(options.views);

  } else {
    this.options = options || {};
  }
}

/**
 * Inherit `Base`
 */

Base.extend(List);

/**
 * Run a plugin on the list instance. Plugins
 * are invoked immediately upon creating the list
 * in the order in which they were defined.
 *
 * ```js
 * list.use(function(views) {
 *   // `views` is the instance, as is `this`
 *
 *   // optionally return a function to be passed to
 *   // the `.use` method of each view created on the
 *   // instance
 *   return function(view) {
 *     // do stuff to each `view`
 *   };
 * });
 * ```
 *
 * @param {Function} `fn` Plugin function. If the plugin returns a function it will be passed to the `use` method of each view created on the instance.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

List.prototype.use = function(fn) {
  var plugin = fn.call(this, this, this.options);
  if (typeof plugin === 'function') {
    this.plugins.push(plugin);
  }
  this.emit('use');
  return this;
};

/**
 * Add an item to the list. An item may be an instance of
 * `Item`, and if not the item is converted to an instance of
 * `Item`.
 *
 * ```js
 * var list = new List(...);
 * list.addItem('a.html', {path: 'a.html', contents: '...'});
 * ```
 * @param {Object} `items` Object of views
 * @api public
 */

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

  item = addPaging(item, this.items);

  this.emit('item', item.key, item);
  this.keys.push(item.key);
  this.items.push(item);
  return this;
};

/**
 * Add an object of `views` to the list.
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

List.prototype.addItems = function(views) {
  for (var key in views) this.addItem(key, views[key]);
  return this;
};

/**
 * Add the items from another instance of `List`.
 *
 * ```js
 * var foo = new List(...);
 * var bar = new List(...);
 * bar.addList(foo);
 * ```
 * @param {Array} `list` Instance of `List`
 * @param {Function} `fn` Optional sync callback function that is called on each item.
 * @api public
 */

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
  return this.keys.indexOf(this.renameKey(key));
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
  return this.items[this.getIndex(key)];
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

function addPaging(item, items) {
  item.data.pager = {};
  item.data.pager.index = items.length;
  item.data.pager.current = item;

  if (items.length) {
    var prev = items[items.length - 1];
    item.data.pager.prev = prev;
    prev.data.pager.next = item;
  }
  return item;
}

/**
 * Expose `List`
 */

module.exports = List;
