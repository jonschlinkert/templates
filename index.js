/*!
 * templates <https://github.com/jonschlinkert/templates>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var Base = require('base-methods');
var helpers = require('./lib/helpers/');
var plugin = require('./lib/plugins/');
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
var Views = lib.views;
var Group = lib.group;
var List = lib.list;

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
  this.defaultConfig();
}

/**
 * Inherit `Base`
 */

Base.extend(Templates);

/**
 * Mixin prototype methods
 */

plugin.option(Templates.prototype);
plugin.routes(Templates.prototype);
plugin.engine(Templates.prototype);
plugin.layout(Templates.prototype);
plugin.render(Templates.prototype);
plugin.lookup(Templates.prototype);
plugin.errors(Templates.prototype, 'Templates');

/**
 * Initialize Templates default configuration
 */

Templates.prototype.defaultConfig = function () {
  this.define('isApp', true);

  this.use(plugin.init);
  this.use(plugin.renameKey());
  this.use(plugin.item('item', 'Item'));
  this.use(plugin.item('view', 'View'));
  this.use(plugin.context);
  this.use(plugin.helpers);

  this.inflections = {};
  this.items = {};
  this.views = {};
  for (var key in this.options.mixins) {
    this.mixin(key, this.options.mixins[key]);
  }
  this.initialize(this.options);
  this.listen(this);
};

/**
 * Initialize defaults. Exposes constructors on
 * app instance.
 */

Templates.prototype.initialize = function () {
  this.define('Base', Base);
  this.define('Item', this.options.Item || Item);
  this.define('List', this.options.List || List);
  this.define('View', this.options.View || View);
  this.define('Collection', this.options.Collection || Collection);
  this.define('Group', this.options.Group || Group);
  this.define('Views', this.options.Views || Views);
};

/**
 * Listen for events
 */

Templates.prototype.listen = function (app) {
  this.on('option', function (key, value) {
    if (key === 'mixins') {
      app.visit('mixin', value);
    }
    utils.updateOptions(app, key, value);
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

Templates.prototype.collection = function (opts, created) {
  opts = opts || {};

  if (!opts.isCollection) {
    utils.defaults(opts, this.options);
  }

  var Collection = opts.Collection || opts.Views || this.get('Views');
  var collection = {};

  if (opts.isCollection === true) {
    collection = opts;

  } else {
    opts.Item = opts.Item || opts.View || this.get('View');
    collection = new Collection(opts);
  }

  if (created !== true) {
    this.extendViews(collection, opts);
  }

  // emit the collection
  this.emit('collection', collection, opts);
  return collection;
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

  if (!opts.isCollection) {
    utils.defaults(opts, this.options);
  }

  var collection = this.collection(opts, true);

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
  this.views[plural] = collection.items || collection.views;

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

  // run collection plugins
  this.plugins.forEach(function (fn) {
    collection.use(fn, opts);
  });

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
  plugin.view.all(this, view, options);
};

/**
 * Decorate or override methods on a view collection instance.
 */

Templates.prototype.extendViews = function(views, options) {
  plugin.views(this, views, options);
};

/**
 * Expose constructors as static methods.
 */

Templates.Base = Base;
Templates.Item = Item;
Templates.View = View;
Templates.List = List;
Templates.Collection = Collection;
Templates.Views = Views;
Templates.Group = Group;

/**
 * Expose package metadata
 */

utils.define(Templates, 'metadata', require('./package'));

/**
 * Expose `Templates`
 */

module.exports = Templates;

/**
 * Expose utils
 */

module.exports.utils = utils;
