/*!
 * templates <https://github.com/jonschlinkert/templates>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var Base = require('base');
var helpers = require('./lib/helpers/');
var plugin = require('./lib/plugins/');
var debug = require('./lib/debug');
var utils = require('./lib/utils');
var lib = require('./lib/');

/**
 * Collection constructors
 */

var Collection = lib.collection;
var Views = lib.views;
var Group = lib.group;
var List = lib.list;

/**
 * Item constructors
 */

var Item = lib.item;
var View = lib.view;

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

  Base.call(this, null, options);
  this.is(Templates);
  this.define('isApp', true);
  debug(this);

  this.debug('initializing');
  this.use(utils.option());
  this.use(utils.plugin());
  this.initTemplates();
}

/**
 * Inherit `Base`
 */

Base.extend(Templates);
Base.bubble(Templates, ['preInit', 'Init']);

/**
 * Mixin static methods
 */

plugin.is(Templates);

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
 * Initialize Templates
 */

Templates.prototype.initTemplates = function() {
  Templates.emit('preInit', this);

  if (!this.plugins) {
    this.plugins = {};
  }

  this.items = {};
  this.views = {};
  this.inflections = {};

  // listen for options events
  this.listen(this);

  this.define('utils', utils);
  this.use(plugin.init);
  this.use(plugin.renameKey());
  this.use(plugin.context);
  this.use(plugin.helpers);
  this.use(plugin.item('item', 'Item'));
  this.use(plugin.item('view', 'View'));

  for (var key in this.options.mixins) {
    this.mixin(key, this.options.mixins[key]);
  }

  // create an async `view` helper
  helpers.view(this);

  // expose constructors on the instance
  this.expose('Item');
  this.expose('View');
  this.expose('List');
  this.expose('Collection');
  this.expose('Group');
  this.expose('Views');

  Templates.setup(this, 'Templates');
  Templates.emit('init', this);
};

/**
 * Expose constructors on app instance, allowing them to be
 * overridden by the user after Templates is instantiated.
 */

Templates.prototype.expose = function(name) {
  this.define(name, {
    configurable: true,
    enumerable: true,
    set: function(val) {
      this.define(this, name, val);
    },
    get: function() {
      return this.options[name] || lib[name.toLowerCase()];
    }
  });
};

/**
 * Listen for events
 */

Templates.prototype.listen = function(app) {
  this.on('option', function(key, value) {
    utils.updateOptions(app, key, value);
  });

  // ensure that plugins are loaded onto collections
  // created after the plugins are registered
  this.on('use', function(fn, app) {
    if (!fn) return;
    for (var key in app.views) {
      if (app.views.hasOwnProperty(key)) {
        app[key].use(fn);
      }
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

Templates.prototype.list = function(opts) {
  opts = opts || {};

  if (!opts.isList) {
    utils.defaults(opts, this.options);
  }

  var List = opts.List || this.get('List');
  var list = {};

  if (opts.isList === true) {
    list = opts;
  } else {
    opts.Item = opts.Item || opts.View || this.get('Item');
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

Templates.prototype.collection = function(opts, created) {
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
    // if it's a view collection, prime the viewType(s)
    if (collection.isViews) {
      collection.viewType();
    }

    // run collection plugins
    this.run(collection);

    // emit the collection
    this.emit('collection', collection, opts);
    this.extendViews(collection, opts);

    // add collection and view helpers
    helpers.singular(this, collection);
    helpers.plural(this, collection);
  } else {

    // emit the collection
    this.emit('collection', collection, opts);
  }
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
  this.debug('creating view collection: "%s"', name);
  opts = opts || {};

  if (!opts.isCollection) {
    opts = utils.merge({}, this.options, opts);
  }

  // emit the collection name and options
  this.emit('create', name, opts);

  // create the actual collection
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

  /* eslint-disable no-proto */
  // decorate loader methods with collection methods
  this[plural].__proto__ = collection;
  this[single].__proto__ = collection;

  // create aliases on the collection for addView/addViews
  // to support chaining
  collection.define(plural, this[plural]);
  collection.define(single, this[single]);

  // run collection plugins
  this.run(collection);

  // extend collection views
  this.extendViews(collection, opts);

  // emit create
  this.emit('postCreate', collection, opts);

  // add collection and view helpers
  helpers.singular(this, collection);
  helpers.plural(this, collection);
  return collection;
};

/**
 * Decorate or override methods on a view created by a collection.
 */

Templates.prototype.extendView = function(view, options) {
  plugin.view(this, view, options);
  return this;
};

/**
 * Decorate or override methods on a view collection instance.
 */

Templates.prototype.extendViews = function(views, options) {
  plugin.views(this, views, options);
  return this;
};

/**
 * Resolve the name of the layout to use for `view`
 */

Templates.prototype.resolveLayout = function(view) {
  if (!utils.isPartial(view)) {
    this.debug('resolving layout for "%s"', view.key);
    var views = this[view.options.collection];
    return views.resolveLayout(view) || this.option('layout');
  }
  return view.layout;
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
 * Expose static `setup` method for providing access to an
 * instance before any other use code is run.
 *
 * ```js
 * function App(options) {
 *   Templates.call(this, options);
 *   Templates.setup(this);
 * }
 * Templates.extend(App);
 * ```
 * @param {Object} `app` Application instance
 * @param {String} `name` Optionally pass the constructor name to use.
 * @return {undefined}
 * @api public
 */

Templates.setup = function(app, name) {
  var setup = app.options['init' + name || app.constructor.name];
  if (typeof setup === 'function') {
    setup.call(app, app, app.options);
  }
};

/**
 * Expose package metadata
 */

utils.define(Templates, 'meta', require('./package'));

/**
 * Expose properties for unit tests
 */

utils.define(Templates, 'utils', utils);
utils.define(Templates, 'debug', debug);
utils.define(Templates, '_', { lib: lib, plugin: plugin });

/**
 * Expose `Templates`
 */

module.exports = Templates;
