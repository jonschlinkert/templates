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

/**
 * Adds groups of items that were generated using `groupBy` to the collection.
 * A collection item is created for each group of items using the template from the
 * `listViews` collection (e.g. "tags" use the "tags" view found on `listViews`).
 *
 * Each group view added will have an items array on the data property contain the grouped items for that specific group.
 * The items array is accessible in templates. Pagination is also possible by passing a `.paginate` property on the options.
 * The items for each group will be paginated and new views will be created for each page.
 *
 * See the examples and tests for more information and advanced usage. To simplify usage, use `app.group` instead.
 *
 * ```js
 * // create the collection passing in the view collection to use for looking up views.
 * var collection = new Collection({listViews: app.lists});
 *
 * // create a new group by using group by on a view collection.
 * var group = app.pages.groupBy('data.tags');
 * //=> {
 * //=>   foo: [<Item "one.hbs">, <Item "two.hbs">],
 * //=>   bar: [<Item "two.hbs">, <Item "three.hbs">],
 * //=>   baz: [<Item "three.hbs">, <Item "four.hbs">]
 * //=> }
 *
 * // add the group to the collection, tell the collection what the names for each group level should be
 * collection.addGroup(group, {names: ['tags']});
 * console.log(collection.items);
 * //=> {
 * //=>   "tags/foo.hbs": <Item "tags/foo.hbs">,
 * //=>   "tags/bar.hbs": <Item "tags/bar.hbs">,
 * //=>   "tags/baz.hbs": <Item "tags/baz.hbs">
 * //=> }
 * ```
 *
 * @param  {Object|Array} `group` Grouped object of items or an array of items.
 * @param  {Object}       `options` Additional options to control how items are added.
 * @return {Object}       `this` for chaining
 */

Collection.prototype.addGroup = function(group, options) {
  this.createGroup(0, '', group, options);
  return this;
};

/**
 * Add a group page to the collection items.
 * Uses the `namespace` to generate the file path.
 * Uses the `name` to lookup the list view to use.
 *
 * ```js
 * var index = collection.addGroupPage('tags', 'tags/foo');
 * ```
 *
 * @param  {String} `name` Name of the list view to use for the page's content.
 * @param  {String} `namespace` Namespace prefix to use for building the file path.
 * @return {Object} The newly added item instance
 */

Collection.prototype.addGroupPage = function(name, namespace) {
  var listView = this.listViews.getView(name);
  var fp = `${namespace}/index${listView.extname}`;
  return this.addItem(fp, {contents: listView.contents});
};

/**
 * Create a group of pages for the specified level, namespace, and grouped items.
 * This will create individual views for each group of items found on the group object.
 * Pagination options may be specified for item arrays on the `options.paginate` property.
 * The pagination options will be used when creating group and item list pages from arrays of items.
 *
 * @param  {Number}       `level` Level of nested currently being grouped. Used to determine when grouping is finished and how to name file paths.
 * @param  {String}       `namespace` Current namespace used when naming file paths.
 * @param  {Object|Array} `group` Current grouped items object being used. Could be an object of arrays or an individual array of items.
 * @param  {Object}       `options` Additional options to control grouping.
 * @return {Object}       `this` for chaining
 */

Collection.prototype.createGroup = function(level, namespace, group, options) {
  options = options || {};
  var names = utils.arrayify(options.names);
  var len = names.length;
  if (level >= len) return;

  var prop = names[level];
  namespace = namespace.length === 0 ? prop : (namespace + '/' + prop);

  var plural = utils.plural(prop);
  var single = utils.single(prop);

  if (Array.isArray(group) || Array.isArray(group.items)) {
    this.createGroupPages(plural, namespace, (group.items || group), options);
    return this;
  }

  var index = this.addGroupPage(plural, namespace);
  addDataFromString(index, namespace);
  var list = index.data[plural] = {};

  var keys = group.keys || Object.keys(group);
  keys.forEach(function(key) {
    var val = (typeof group.get === 'function') ? group.get(key) : group[key];
    if (Array.isArray(val) || Array.isArray(val.items)) {
      list[key] = this.createListPages(key, single, `${namespace}/${key}`, (val.items || val), level, options);
      return;
    }
    list[key] = this.createListPage(key, single, `${namespace}/${key}`, val, level, options);
  }, this);
  return this;
};

/**
 * Create paginated group pages based on the `options.paginate` property. If `options.paginate`
 * is not specified, then a single page is added with all the specificed items on the data.items property.
 *
 * @param  {String} `name` Name of the list view to use for creating item views.
 * @param  {String} `namespace` Namespace prefix to use when generating the file path.
 * @param  {Array}  `items` List of items to paginate when creating multiple pages or to add to the data object for a single page.
 * @param  {Object} `options` Additional options.
 * @return {Object} First view created.
 */

Collection.prototype.createGroupPages = function(name, namespace, items, options) {
  options = options || {};
  if (typeof options.paginate === 'undefined') {
    var index = this.addGroupPage(name, namespace);
    addDataFromString(index, namespace);
    index.data.items = items;
    return index;
  }

  var first;
  var list = new this.List(items);
  var pages = list.paginate(options.paginate);
  var listView = this.listViews.getView(name);

  pages.forEach(function(page) {
    var fp = `${namespace}/page/${page.idx}/index${listView.extname}`;
    var item = this.addItem(fp, {contents: listView.contents});
    addDataFromString(item, namespace);
    item.data.pagination = page;
    item.data.items = page.items;
    if (!first) first = item;
  });
  return first;
};

/**
 * Create a list page for a list of items in a group. This uses the singluar named view from the list views collection to create
 * pages groups of items.
 *
 * @param  {String}       `name` Name of the group currently being created. This will be added to the data object.
 * @param  {String}       `single` Singular name of the list view to use for the views being created.
 * @param  {String}       `namespace` Namespace prefix to use for the file paths.
 * @param  {Object|Array} `group` Object of grouped items or array of items to add to the items property on the data object.
 * @param  {Number}       `level` Current level of grouped items being grouped.
 * @param  {Object}       `options` Additional options.
 * @return {Object}       View item instance that is created for this list.
 */

Collection.prototype.createListPage = function(name, single, namespace, group, level, options) {
  var itemView = this.listViews.getView(single);
  var fp = `${namespace}${itemView.extname}`;
  var item = this.addItem(fp, {contents: itemView.contents});
  addDataFromString(item, namespace);

  if (Array.isArray(group) || Array.isArray(group.items)) {
    item.data.items = (group.items || group);
  } else if (typeof group === 'object') {
    item.data[single] = name;
    item.data[options.names[level + 1]] = group.groups || group;
    this.createGroup(level + 1, `${namespace}`, group, options);
  }
  return item;
};

/**
 * Create paginated list pages based on the `options.paginate` property. If `options.paginate`
 * is not specified, then a single page is added with all the specificed items on the data.items property.
 *
 * @param  {String} `name` Name of the group currenlty being created.
 * @param  {String} `single` Name of the list view to use for creating item views.
 * @param  {String} `namespace` Namespace prefix to use when generating the file path.
 * @param  {Array}  `items` List of items to paginate when creating multiple pages or to add to the data object for a single page.
 * @param  {Number} `level` Current level of grouped items being grouped.
 * @param  {Object} `options` Additional options.
 * @return {Object} First view created.
 */

Collection.prototype.createListPages = function(name, single, namespace, items, level, options) {
  options = options || {};
  if (typeof options.paginate === 'undefined') {
    var item = this.createListPage(name, single, namespace, items, level, options);
    return item;
  }

  var first;
  var list = new this.List(items);
  var pages = list.paginate(options.paginate);
  var itemView = this.listViews.getView(single);

  pages.forEach(function(page) {
    var fp = `${namespace}/page/${page.idx}/index${itemView.extname}`;
    var item = this.addItem(fp, {contents: itemView.contents});
    addDataFromString(item, namespace);
    item.data.pagination = page;
    item.data.items = page.items;
    if (!first) first = item;
  });
  return first;
};

/**
 * Splits a string by `/` and adds data values for each pair found.
 *
 * ```js
 * addDataFromString(view, 'foo/bar/baz/bang');
 * console.log(view.data);
 * //=> { foo: 'bar', baz: 'bang' }
 * ```
 * @param {Object} `view` Instance of a view.
 * @param {String} `str` String containing key/value pairs to add.
 */

function addDataFromString(view, str) {
  str.split('/').reduce(function(acc, seg, i) {
    if (i % 2 === 1) {
      // set the singular form of the key (acc) on the data property
      view.data[utils.single(acc)] = seg;
    } else {
      // save the key for the next round
      acc = seg;
    }
    return acc;
  }, '');
}

/**
 * Expose static properties
 */

utils.define(Collection, 'Item', require('vinyl-item'));
utils.define(Collection, 'View', require('vinyl-view'));
