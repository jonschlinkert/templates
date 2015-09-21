'use strict';

var Base = require('base-methods');
var decorate = require('./decorate');
var utils = require('./utils');

module.exports = Collection;

/**
 * Create an instance of `Collection` with the given `options`.
 *
 * ```js
 * var collection = new Collection();
 * collection.addItem('foo', {content: 'bar'});
 * ```
 * @param {Object} `options`
 * @api public
 */

function Collection(options) {
  Base.call(this);
  options = options || {};

  // decorate the instance
  utils.renameKey(this);

  // add constructors
  this.define('List', options.List || require('./list'));
  this.define('Item', options.Item || require('./item'));
  this.define('loaded', false);
  this.define('plugins', []);

  this.isCollection = true;
  this.queue = [];
  this.items = {};

  // if an instance of `List` of `Collection` is passed, load it now
  if (Array.isArray(options) || options instanceof this.List) {
    this.options = options.options;
    this.addList(options.items);

  } else if (options instanceof Collection) {
    this.options = options.options;
    this.addItems(options.items);

  } else {
    this.options = options;
  }
}

Base.extend(Collection);
decorate.config(Collection.prototype);

/**
 * Run a plugin on the collection instance. Plugins
 * are invoked immediately upon creating the collection
 * in the order in which they were defined.
 *
 * ```js
 * collection.use(function(items) {
 *   // `items` is the instance, as is `this`
 *
 *   // optionally return a function to be passed to
 *   // the `.use` method of each item created on the
 *   // instance
 *   return function(item) {
 *     // do stuff to each `item`
 *   };
 * });
 * ```
 *
 * @param {Function} `fn` Plugin function. If the plugin returns a function it will be passed to the `use` method of each item created on the instance.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Collection.prototype.use = function(fn) {
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

utils.itemFactory(Collection.prototype, 'item', 'Item');

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

Collection.prototype.setItem = function(key, value) {
  var item = this.item(key, value);
  this.items[item.key] = item;
  return item;
};

/**
 * Adds event emitting and custom loading to [setItem](#setItem).
 *
 * @param {String} `key`
 * @param {Object} `value`
 * @api public
 */

Collection.prototype.addItem = function(key, value) {
  var args = [].slice.call(arguments);
  this.emit.apply(this, ['addItem'].concat(args));

  var item = this.setItem(key, value);
  while (this.queue.length) {
    this.setItem(this.queue.shift());
  }
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
 * @return {Object} returns the `collection` object
 * @api public
 */

Collection.prototype.addItems = function(items) {
  if (Array.isArray(items)) {
    return this.addList.apply(this, arguments);
  }
  this.emit('addItems', items);
  if (this.loaded) return this;

  this.visit('addItem', items);
  return this;
};

/**
 * Load an array of items onto the collection.
 *
 * ```js
 * collection.addList([
 *   {path: 'a.html', content: '...'},
 *   {path: 'b.html', content: '...'},
 *   {path: 'c.html', content: '...'}
 * ]);
 * ```
 * @param {Array} `items`
 * @return {Object} returns the `collection` instance
 * @api public
 */

Collection.prototype.addList = function(list) {
  this.emit('addList', list);
  if (this.loaded) return this;

  if (!Array.isArray(list)) {
    throw new TypeError('expected list to be an array.');
  }

  var len = list.length, i = -1;
  while (++i < len) {
    var item = list[i];
    this.addItem(item.path, item);
  }
  return this;
};

/**
 * Get an item from the collection.
 *
 * ```js
 * collection.getItem('a.html');
 * ```
 * @param {String} `key` Key of the item to get.
 * @return {Object}
 * @api public
 */

Collection.prototype.getItem = function(key) {
  return this.items[key] || this.items[this.renameKey.call(this, key)];
};
