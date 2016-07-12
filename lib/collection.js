'use strict';

var Base = require('base');
var debug = require('debug')('base:templates:collection');
var plugin = require('./plugins');
var utils = require('./utils');

/**
 * Expose `Collection`
 */

module.exports = exports = Collection;

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

  Base.call(this, {}, options);
  this.is('Collection');
  this.items = {};

  this.use(utils.option());
  this.use(utils.plugin());
  this.init(options || {});
}

/**
 * Inherit `Base`
 */

Base.extend(Collection);

/**
 * Mixin static methods
 */

plugin.is(Collection);

/**
 * Initialize `Collection` defaults
 */

Collection.prototype.init = function(opts) {
  debug('initializing', __filename);

  // add constructors to the instance
  this.define('Item', opts.Item || Collection.Item);
  this.define('View', opts.View || Collection.View);

  this.use(plugin.renameKey());
  this.use(plugin.item('item', 'Item', {emit: false}));

  // if an instance of `List` or `Collection` is passed, load it now
  if (Array.isArray(opts) || opts.isList) {
    this.options = opts.options;
    this.addList(opts.items);

  } else if (opts.isCollection) {
    this.options = opts.options;
    this.addItems(opts.items);

  } else {
    this.options = opts;
    this.define('listViews', this.options.listViews);
  }
};

/**
 * Add an item to the collection.
 *
 * ```js
 * collection.addItem('foo', {content: 'bar'});
 * ```
 * @emits `item` With the created `item` and `collection` instance as arguments.
 * @param {String|Object} `key` Item name or object
 * @param {Object} `val` Item object, when `key` is a string.
 * @developer The `item` method is decorated onto the collection using the `item` plugin
 * @return {Object} returns the `item` instance.
 * @api public
 */

Collection.prototype.addItem = function(key, val) {
  debug('adding item "%s"');
  var item = this.item(key, val);
  if (typeof item.use === 'function') {
    this.run(item);
  }
  this.emit('item', item, this);
  this.items[item.key] = item;
  return item;
};

/**
 * Identical to `.addItem`, except the collection instance is returned instead of
 * the item, to allow chaining.
 *
 * ```js
 * collection.setItem('foo', {content: 'bar'});
 * ```
 * @emits `item` With the created `item` and `collection` instance as arguments.
 * @param {String|Object} `key` Item name or object
 * @param {Object} `val` Item object, when `key` is a string.
 * @return {Object} returns the `collection` instance.
 * @api public
 */

Collection.prototype.setItem = function(/*key, value*/) {
  this.addItem.apply(this, arguments);
  return this;
};

/**
 * Get an item from `collection.items`.
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

/**
 * Remove an item from `collection.items`.
 *
 * ```js
 * items.deleteItem('abc');
 * ```
 * @param {String} `key`
 * @return {Object} Returns the instance for chaining
 * @api public
 */

Collection.prototype.deleteItem = function(item) {
  if (typeof item === 'string') {
    item = this.getItem(item);
  }
  delete this.items[item.key];
  return this;
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
  if (!Array.isArray(list)) {
    throw new TypeError('expected list to be an array.');
  }

  if (typeof fn !== 'function') {
    fn = utils.identity;
  }
  var len = list.length;
  var idx = -1;

  while (++idx < len) {
    this.addItem(fn(list[idx]));
  }
  return this;
};

Collection.prototype.createGroupPage = function(name, namespace) {
  var listView = this.listViews.getView(name);
  var fp = `${namespace}/index${listView.extname}`;
  return this.addItem(fp, {contents: listView.contents});
};

Collection.prototype.createGroupIndexPages = function(name, namespace, items, opts) {
  opts = opts || {};
  if (typeof opts.paginate === 'undefined') {
    var index = this.createGroupPage(name, namespace);
    index.data.items = items;
    return index;
  }

  var first;
  var list = new this.List(items);
  var pages = list.paginate(opts.paginate);
  var listView = this.listViews.getView(name);

  pages.forEach(function(page) {
    var fp = `${namespace}/page/${page.idx}/index${listView.extname}`;
    var item = this.addItem(fp, {contents: listView.contents});
    item.data.pagination = page;
    item.data.items = page.items;
    if (!first) first = item;
  });
  return first;
};

Collection.prototype.createItemListPage = function(name, single, namespace, config, level, opts) {
  var itemView = this.listViews.getView(single);
  var fp = `${namespace}${itemView.extname}`;
  var item = this.addItem(fp, {contents: itemView.contents});

  if (Array.isArray(config)) {
    item.data.items = config;
  } else {
    item.data[single] = name;
    item.data[opts.names[level + 1]] = config;
    this.createSubcollection(level + 1, `${namespace}`, config, opts);
  }
  return item;
};

Collection.prototype.createItemListIndexPages = function(name, single, namespace, items, level, opts) {
  opts = opts || {};
  if (typeof opts.paginate === 'undefined') {
    var item = this.createItemListPage(name, single, namespace, items, level, opts);
    return item;
  }

  var first;
  var list = new this.List(items);
  var pages = list.paginate(opts.paginate);
  var itemView = this.listViews.getView(single);

  pages.forEach(function(page) {
    var fp = `${namespace}/page/${page.idx}/index${itemView.extname}`;
    var item = this.addItem(fp, {contents: itemView.contents});
    item.data.pagination = page;
    item.data.items = page.items;
    if (!first) first = item;
  });
  return first;
};

Collection.prototype.createSubcollection = function(level, namespace, config, opts) {
  opts = opts || {};
  var names = opts.names;
  var len = names.length;
  if (level >= len) return;

  var prop = names[level];
  namespace = namespace.length === 0 ? prop : (namespace + '/' + prop);

  var plural = utils.plural(prop);
  var single = utils.single(prop);

  if (Array.isArray(config)) {
    this.createGroupIndexPages(plural, namespace, config, opts);
    return;
  }

  var index = this.createGroupPage(plural, namespace);
  var list = index.data[plural] = {};

  var keys = Object.keys(config);
  keys.forEach(function(key) {
    if (Array.isArray(config[key])) {
      list[key] = this.createItemListIndexPages(key, single, `${namespace}/${key}`, config[key], level, opts);
      return;
    }
    list[key] = this.createItemListPage(key, single, `${namespace}/${key}`, config[key], level, opts);
  }, this);
};


Collection.prototype.addGroup = function(group, options) {
  return this.createSubcollection(0, '', group, options);
};

/**
 * Expose static properties
 */

utils.define(Collection, 'Item', require('vinyl-item'));
utils.define(Collection, 'View', require('vinyl-view'));
