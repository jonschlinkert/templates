'use strict';

var Base = require('base-methods');
var decorate = require('./decorate');
var utils = require('./utils');
var Group = require('./group');

/**
 * Expose `List`
 */

module.exports = List;

function List(options) {
  Base.call(this);
  options = options || {};

  // decorate the instance
  decorate.init(this);
  utils.renameKey(this);

  // add constructors to the instance
  this.define('Item', options.Item || require('./view'));
  this.define('Views', options.Views || require('./views'));
  this.define('plugins', []);

  this.isList = true;
  this.queue = [];
  this.items = [];
  this.keys = [];

  // if an instance of `List` of `Views` is passed, load it now
  if (Array.isArray(options) || options instanceof List) {
    this.options = options.options || {};
    this.addList(options.items || options);

  } else if (options instanceof this.Views) {
    this.options = options.options;
    this.addItems(options.views);

  } else {
    this.options = options;
  }
}

/**
 * Inherit `Base`
 */

Base.extend(List);

decorate.config(List.prototype);
decorate.routes(List.prototype);
decorate.engine(List.prototype);
decorate.context(List.prototype);
decorate.helpers(List.prototype);
decorate.layout(List.prototype);
decorate.render(List.prototype);
decorate.lookup(List.prototype);
decorate.errors(List.prototype, 'List');

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
 * Returns a new item, using the `Item` class
 * currently defined on the instance.
 *
 * ```js
 * var item = app.item('foo', {conetent: '...'});
 * // or
 * var item = app.item({path: 'foo', conetent: '...'});
 * ```
 * @name .item
 * @param {String|Object} `key` Item key or object
 * @param {Object} `value` If key is a string, value is the item object.
 * @return {Object} returns the `item` object
 * @api public
 */

utils.itemFactory(List.prototype, 'item', 'Item');

/**
 * Set an item on the collection. This is identical to [addItem](#addItem)
 * except `setItem` does not emit an event for each item.
 *
 * ```js
 * collection.setItem('foo', {content: 'bar'});
 * ```
 *
 * @param {String|Object} `key` Item key or object
 * @param {Object} `value` If key is a string, value is the item object.
 * @developer This method is decorated onto the collection in the constructor using the `createItem` utility method.
 * @return {Object} returns the `item` instance.
 * @api public
 */

List.prototype.setItem = function(key, value) {
  var item = this.item(key, value);
  item = addPaging(item, this.items);
  this.keys.push(item.key);
  this.items.push(item);
  return this;
};

/**
 * Adds event emitting and custom loading to [setItem](#setItem).
 *
 * @param {String} `key`
 * @param {Object} `value`
 * @api public
 */

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
  var args = [].slice.call(arguments);
  this.emit.apply(this, ['addItem'].concat(args));

  var item = this.setItem(key, value);
  while (this.queue.length) {
    this.setItem(this.queue.shift());
  }
  return item;
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
  return this.keys.indexOf(this.renameKey.call(this, key));
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
