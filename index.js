/*!
 * templates <https://github.com/jonschlinkert/templates>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var Base = require('base-methods');
var decorate = require('./lib/decorate/');
var helpers = require('./lib/helpers/');
var utils = require('./lib/utils/');
var lib = require('./lib/');

/**
 * Item constructors
 */

var Item = lib.item;
var View = lib.view;

/**
 * Collection constructors
 */

var Collection = lib.collection;
var List = lib.list;
var Views = lib.views;
var Group = lib.group;

/**
 * This function is the main export of the templates module.
 * Initialize an instance of `templates` to create your
 * application.
 *
 * ```js
 * var templates = require('templates');
 * var app = templates();
 * ```
 * @param {Object} `options`
 * @api public
 */

function Templates(options) {
  if (!(this instanceof Templates)) {
    return new Templates(options);
  }
  Base.call(this);
  this.options = options || {};
  this.define('plugins', []);
  utils.renameKey(this);
  this.defaultConfig();
}

/**
 * Inherit Base methods
 */

Base.extend(Templates);

/**
 * Initialize Templates default configuration
 */

Templates.prototype.defaultConfig = function () {
  // used in plugins to verify the app instance
  this.define('isApp', true);
  this.inflections = {};
  decorate.init(this);

  for (var key in this.options.mixins) {
    this.mixin(key, this.options.mixins[key]);
  }
  this.initialize();
  this.listen(this);
};

/**
 * Decorate methods onto the Templates prototype
 */

decorate.config(Templates.prototype);
decorate.routes(Templates.prototype);
decorate.engine(Templates.prototype);
decorate.context(Templates.prototype);
decorate.helpers(Templates.prototype);
decorate.layout(Templates.prototype);
decorate.render(Templates.prototype);
decorate.lookup(Templates.prototype);
decorate.errors(Templates.prototype, 'Templates');

/**
 * Initialize defaults. Exposes constructors on
 * app instance.
 */

Templates.prototype.initialize = function () {
  this.define('Base', Base);
  this.define('Item', this.options.Item || Item);
  this.define('View', this.options.View || View);
  this.define('List', this.options.List || List);
  this.define('Collection', this.options.Collection || Collection);
  this.define('Views', this.options.Views || Views);
  this.define('Group', this.options.Group || Group);
};

/**
 * Listen for events
 */

Templates.prototype.listen = function (app) {
  this.on('option', function (key, value) {
    if (key === 'mixins') {
      app.visit('mixin', value);
    }
    utils.optionUpdated(app, key, value);
  });

  this.on('error', function (err) {
    if (!err || err.id !== 'rethrow') return;
    if (app.options.silent !== true) {
      console.error(err.reason);
    }
  });
};

/**
 * Run a plugin on the instance. Plugins are invoked
 * immediately upon creating the collection in the order
 * in which they were defined.
 *
 * ```js
 * var {%= type %} = {%= ctor %}()
 *   .use(require('foo'))
 *   .use(require('bar'))
 *   .use(require('baz'))
 * ```
 *
 * @name .use
 * @param {Function} `fn` Plugin function. If the plugin returns a function it will be passed to the `use` method of each collection created on the instance.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Templates.prototype.use = function (fn) {
  var plugin = fn.call(this, this, this.options);
  if (typeof plugin === 'function') {
    this.plugins.push(plugin);
  }
  this.emit('use');
  return this;
};

/**
 * Returns a new view, using the `View` class
 * currently defined on the instance.
 *
 * ```js
 * var view = app.view('foo', {conetent: '...'});
 * // or
 * var view = app.view({path: 'foo', conetent: '...'});
 * ```
 * @name .view
 * @param {String|Object} `key` View key or object
 * @param {Object} `value` If key is a string, value is the view object.
 * @return {Object} returns the `view` object
 * @api public
 */

utils.itemFactory(Templates.prototype, 'view', 'View');

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

utils.itemFactory(Templates.prototype, 'item', 'Item');

/**
 * Create a new collection. Collections are decorated with
 * special methods for getting and setting items from the
 * collection. Note that, unlike the [create](#create) method,
 * collections created with `.collection()` are not cached.
 *
 * See the [collection docs](docs/collections.md) for more
 * information about collections.
 *
 * @name .collection
 * @param  {Object} `opts` Collection options
 * @return {Object} Returns the `collection` instance for chaining.
 * @api public
 */

Templates.prototype.collection = function (opts) {
  opts = opts || {};

  if (!opts.views && !opts.options) {
    utils.defaults(opts, this.options);
  }

  var Collection = opts.Collection || this.get('Collection');
  var collection = {};

  if (opts instanceof Collection) {
    collection = opts;
  } else {
    opts.Item = opts.Item || this.get('Item');
    collection = new Collection(opts);
  }

  this.extendViews(collection, opts);

  // emit the collection
  this.emit('collection', collection, opts);
  return collection;
};

/**
 * Create a new view collection. View collections are decorated
 * with special methods for getting, setting and rendering
 * views from that collection. Collections created with this method
 * are not stored on `app.views` as with the [create](#create) method.
 *
 * See the [collection docs](docs/collections.md#view-collections) for more
 * information about view collections.
 *
 * @name .viewCollection
 * @param  {Object} `opts` View collection options.
 * @return {Object} Returns the view collection instance for chaining.
 * @api public
 */

Templates.prototype.viewCollection = function (opts, created) {
  opts = opts || {};

  if (!opts.views && !opts.options) {
    utils.defaults(opts, this.options);
  }

  var Views = opts.Views || this.get('Views');
  var views = {};

  if (opts instanceof Views) {
    views = opts;
  } else {
    opts.View = opts.View || this.get('View');
    views = new Views(opts);
  }

  if (created !== true) {
    this.extendViews(views, opts);
  }

  // emit the views
  this.emit('viewCollection', views, opts);
  return views;
};

/**
 * Create a new view collection to be stored on the `app.views` object. See
 * the [create docs](docs/collections.md#create) for more details.
 *
 * @name .create
 * @param  {String} `name` The name of the collection to create. Plural or singular form may be used, as the inflections are automatically resolved when the collection
 * is created.
 * @param  {Object} `opts` Collection options
 * @return {Object} Returns the `collection` instance for chaining.
 * @api public
 */

Templates.prototype.create = function(name, opts) {
  opts = opts || {};
  if (!opts.views && !opts.options) {
    utils.defaults(opts, this.options);
  }

  var collection = this.viewCollection(opts, true);
  var self = this;

  // get the collection inflections, e.g. page/pages
  var single = utils.single(name);
  var plural = utils.plural(name);

  // map the inflections for lookups
  this.inflections[single] = plural;

  // add inflections to collection options
  collection.option('inflection', single);
  collection.option('plural', plural);

  // prime the viewType(s) for the collection
  this.viewType(plural, collection.viewType());

  // add the collection to `app.views`
  this.views[plural] = collection.views;

  // create loader functions for adding views to this collection
  this.define(plural, collection.addViews.bind(collection));
  this.define(single, collection.addView.bind(collection));

  // decorate loader methods with collection methods
  this[plural].__proto__ = collection;
  this[single].__proto__ = collection;

  // create aliases on the collection for
  // addView/addViews to support chaining
  collection.define(plural, this[plural]);
  collection.define(single, this[single]);
  collection.define('app', function () {
    return self;
  });

  // run collection plugins
  this.plugins.forEach(function (fn) {
    collection.use(fn, opts);
  }.bind(this));

  // emit create
  this.emit('create', collection, opts);
  this.extendViews(collection, opts);

  // add collection and view helpers
  helpers.plural(this, this[plural], opts);
  helpers.single(this, this[single], opts);
  return collection;
};

/**
 * Decorate or override methods on a view created by a collection.
 */

Templates.prototype.extendView = function (view, options) {
  decorate.view.all(this, view, options);
};

/**
 * Decorate or override methods on a view collection instance.
 */

Templates.prototype.extendViews = function (views, options) {
  decorate.views(this, views, options);
};

/**
 * Mix in a prototype method
 */

Templates.prototype.mixin = function(key, value) {
  Templates.prototype[key] = value;
};

/**
 * Expose `Templates`
 */

module.exports = Templates;

/**
 * Expose constructors
 */

module.exports.Base = Base;
module.exports.Item = Item;
module.exports.View = View;
module.exports.Collection = Collection;
module.exports.Views = Views;
module.exports.List = List;
module.exports.Group = Group;

/**
 * Expose utils
 */

module.exports.utils = utils;
