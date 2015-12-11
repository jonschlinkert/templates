'use strict';

var Base = require('./base');
var plugin = require('./plugins');
var utils = require('./utils');

/**
 * Expose `Collection`
 */

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
  if (!(this instanceof Collection)) {
    return new Collection(options);
  }

  this.options = options || {};
  utils.isName(this, 'Collection');

  Base.call(this);
  this.init(this.options);
}

/**
 * Inherit `Base`
 */

Base.extend(Collection);

/**
 * Initialize `Collection` defaults
 */

Collection.prototype.init = function(opts) {
  this.is('Collection');

  this.define('List', opts.List || require('./list'));
  this.define('Item', opts.Item || require('./item'));
  this.define('loaded', false);

  this.use(plugin.renameKey());
  this.use(plugin.item('item', 'Item'));

  this.queue = [];
  this.items = {};

  // if an instance of `List` or `Collection` is passed, load it now
  if (Array.isArray(opts) || opts.isList) {
    this.options = opts.options;
    this.addList(opts.items);

  } else if (opts.isCollection) {
    this.options = opts.options;
    this.addItems(opts.items);

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

Collection.prototype.setItem = function(key, value) {
  var item = this.item(key, value);
  if (item.use) this.run(item);
  this.items[item.key] = item;
  return item;
};

/**
 * Similar to `setItem`, adds an item to the collection but also fires an
 * event and iterates over the item `queue` to load items from the
 * `addItem` event listener.  An item may be an instance of `Item`, if
 * not, the item is converted to an instance of `Item`.
 *
 * ```js
 * var list = new List(...);
 * list.addItem('a.html', {path: 'a.html', contents: '...'});
 * ```
 * @param {String} `key`
 * @param {Object} `value`
 * @api public
 */

Collection.prototype.addItem = function(/*key, value*/) {
  var args = [].slice.call(arguments);
  this.emit.call(this, 'addItem', args);

  var item = this.setItem.apply(this, args);
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
 * @return {Object} returns the instance for chaining
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
 * @param {Array} `items` or an instance of `List`
 * @param {Function} `fn` Optional sync callback function that is called on each item.
 * @return {Object} returns the Collection instance for chaining
 * @api public
 */

Collection.prototype.addList = function(list, fn) {
  this.emit('addList', list);
  if (this.loaded) return this;

  if (!Array.isArray(list)) {
    throw new TypeError('expected list to be an array.');
  }

  if (typeof fn !== 'function') {
    fn = utils.identity;
  }

  var len = list.length, i = -1;
  while (++i < len) {
    var item = fn(list[i]);
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
  return this.items[key] || this.items[this.renameKey(key)];
};
