/*!
 * templates <https://github.com/jonschlinkert/templates>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var helpers = require('./lib/helpers/');
var plugin = require('./lib/plugins/');
var utils = require('./lib/utils/');
var Base = require('./lib/base');
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
  this.defaultConfig();
}

/**
 * Inherit `Base`
 */

Base.extend(Templates);

/**
 * Mixin prototype methods
 */

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
  this.is('App');
  this.plugins = [];

  this.use(plugin.init);
  this.use(plugin.renameKey());
  this.use(plugin.context);
  this.use(plugin.helpers);
  this.use(plugin.item('item', 'Item'));
  this.use(plugin.item('view', 'View'));

  this.inflections = {};
  this.items = {};
  this.views = {};

  for (var key in this.options.mixins) {
    this.mixin(key, this.options.mixins[key]);
  }

  // listen for options events
  this.listen(this);

  // expose constructors on the instance
  this.expose('Base');
  this.expose('Item');
  this.expose('List');
  this.expose('View');
  this.expose('Collection');
  this.expose('Group');
  this.expose('Views');
};

/**
 * Expose constructors on app instance.
 */

Templates.prototype.expose = function (name) {
  this.define(name, this.options[name] || lib[name.toLowerCase()]);
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
 * Create a new list. See the [list docs](docs/lists.md) for more
 * information about lists.
 *
 * ```js
 * var list = app.list();
 * list.addItem('abc', {content: '...'});
 *
 * // or, create list from a collection
 * app.create('pages');
 * var list = app.list(app.pages);
 * ```
 * @param  {Object} `opts` List options
 * @return {Object} Returns the `list` instance for chaining.
 * @api public
 */

Templates.prototype.list = function (opts) {
  opts = opts || {};

  if (!opts.isList) {
    utils.defaults(opts, this.options);
  }

  var List = opts.List || this.get('List');
  var list = {};

  if (opts.isList === true) {
    list = opts;

  } else {
    opts.Item = opts.Item || opts.Item || this.get('Item');
    list = new List(opts);
  }

  // customize list items
  this.extendViews(list, opts);

  // emit the list
  this.emit('list', list, opts);
  return list;
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
  this.define(plural, function() {
    return collection.addViews.apply(collection, arguments);
  });
  this.define(single, function() {
    return collection.addView.apply(collection, arguments);
  });

  // decorate loader methods with collection methods
  this[plural].__proto__ = collection;
  this[single].__proto__ = collection;

  // create aliases on the collection for addView/addViews
  // to support chaining
  collection.define(plural, this[plural]);
  collection.define(single, this[single]);

  // run collection plugins
  this.run(collection);

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
