'use strict';

var Base = require('base');
var debug = require('debug')('base:templates:groups');
var lib = require('./');
var utils = require('./utils');
var plugin = require('./plugins/');

/**
 * Expose `Groups`
 */

module.exports = exports = Groups;

/**
 * Create an instance of `Groups` with the given `options`.
 *
 * ```js
 * var group = new Groups(itemViews, listViews);
 * ```
 * @param {Object} `itemViews` View collection containing the views to group.
 * @param {Object} `listViews` View collection containing index and list views used for rendering groups.
 * @api public
 */

function Groups(itemViews, listViews) {
  if (!(this instanceof Groups)) {
    return new Groups(itemViews, listViews);
  }

  Base.call(this);
  this.is('Groups');
  this.define('isApp', true);
  this.use(utils.option());
  this.use(utils.plugin());
  this.init(itemViews, listViews);
}

/**
 * Inherit `Base`
 */

/**
 * Inherit `Base` and load static plugins
 */

plugin.static(Base, Groups, 'Groups');


/**
 * Initialize Groups defaults. Makes `options` and `cache`
 * (inherited from `Base`) non-emumerable.
 */

Groups.prototype.init = function(itemViews, listViews) {
  debug('initializing');
  var opts = {};

  Object.defineProperty(this, 'options', {
    configurable: true,
    enumerable: false,
    set: function(val) {
      opts = val;
    },
    get: function() {
      return opts || {};
    }
  });

  this.use(plugin.init);
  this.use(plugin.renameKey());
  this.use(plugin.context);
  this.use(plugin.lookup);
  this.use(utils.engines());
  this.use(utils.helpers());
  this.use(utils.routes())

  this.use(plugin.item('item', 'Item'));
  this.use(plugin.item('view', 'View'));

  this.inflections = {};
  this.define('views', {});
  this.define('collections', {});
  this.define('cache', this.cache);

    // expose constructors on the instance
  this.expose('Item');
  this.expose('View');
  this.expose('List');
  this.expose('Collection');
  this.expose('Views');

  this.define('itemViews', itemViews);
  this.define('listViews', listViews);
};

/**
 * Expose constructors on instance, allowing them to be
 * overridden by the user after Groups is instantiated.
 */

Groups.prototype.expose = function(name) {
  this.define(name, {
    configurable: true,
    enumerable: true,
    get: function() {
      return this.options[name] || Groups[name];
    }
  });
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

Groups.prototype.collection = function(opts, created) {
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

  } else {

    // emit the collection
    this.emit('collection', collection, opts);
  }
  return collection;
};

/**
 * Create a new view collection to be stored on the `group.views` object. See
 * the [create docs](docs/collections.md#create) for more details.
 *
 * @param  {String} `name` The name of the collection to create. Plural or singular form may be used, as the inflections are automatically resolved when the collection
 * is created.
 * @param  {Object} `opts` Collection options
 * @return {Object} Returns the `collection` instance for chaining.
 * @api public
 */

Groups.prototype.create = function(name, props, opts) {
  debug('creating group collection: "%s"', name);
  if (typeof props === 'object' && !Array.isArray(props)) {
    opts = props;
    props = null;
  }
  opts = opts || {};

  if (!opts.isCollection) {
    opts = utils.merge({}, this.options, opts);
  }

  // emit the collection name and options
  this.emit('create', name, opts);

  props = utils.arrayify(props);
  if (props.length === 0) {
    props.push(name);
  }

  // create the actual collection
  var collection = this.collection(opts, true);
  utils.setInstanceNames(collection, name);

  this.collections[name] = collection;

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

  // create aliases on the collection for
  // addView/addViews to support chaining
  collection.define(plural, this[plural]);
  collection.define(single, this[single]);

  // run collection plugins
  this.run(collection);

  // decorate collection and views in collection
  // (this is a prototype method to allow overriding behavior)
  this.extendViews(collection, opts);

  var names = [];
  normalize(props, function(prop, idx) {
    if (typeof prop === 'string') {
      if (/^data\./.test(prop)) {
        names.push(prop.slice(5));
      } else {
        names.push(prop);
        props[idx] = `data.${prop}`;
      }
    }
  });

  var group = this.itemViews.groupBy.apply(this.itemViews, props);
  var len = names.length;

  var createIndex = function(name, namespace, config) {
    var listView = this.listViews.getView(name);
    var fp = `${namespace}/index${listView.extname}`;
    return collection.addView(fp, {contents: listView.contents});
  }.bind(this);

  var createItem = function(name, single, plural, namespace, config, idx) {
    var itemView = this.listViews.getView(single);
    var fp = `${namespace}${itemView.extname}`;
    var item = collection.addView(fp, {contents: itemView.contents});

    if (Array.isArray(config)) {
      item.data.items = config;
    } else {
      item.data[single] = name;
      item.data[names[idx + 1]] = config;
      createCollection(idx + 1, `${namespace}`, config);
    }
    return item;
  }.bind(this);

  var createCollection = function(idx, namespace, config) {
    if (idx >= len) return;
    var prop = names[idx];
    namespace = namespace.length === 0 ? prop : (namespace + '/' + prop);

    var plural = utils.plural(prop);
    var single = utils.single(prop);

    var index = createIndex(plural, namespace, config);
    var list = index.data[plural] = {};

    var keys = Object.keys(config);
    keys.forEach(function(key) {
      var item = createItem(key, single, plural, `${namespace}/${key}`, config[key], idx);
      list[key] = item;
    });
  }.bind(this);

  createCollection(0, '', group);

  // emit create
  this.emit('postCreate', collection, opts);

  return collection;
};

/**
 * Decorate or override methods on a view created by a collection.
 */

Groups.prototype.extendView = function(view, options) {
  plugin.view(this, view, options);
  return this;
};

/**
 * Decorate or override methods on a view collection instance.
 */

Groups.prototype.extendViews = function(views, options) {
  plugin.views(this, views, options);
  return this;
};

/**
 * Decorate or override methods on a view collection instance.
 */

Groups.prototype.extendList = function(views, options) {
  plugin.list(this, views, options);
  return this;
};

Groups.Collection = lib.collection;
Groups.List = lib.list;
Groups.Views = lib.views;
Groups.Item = lib.item;
Groups.View = lib.view;


function normalize(props, iterator) {
  var len = props.length, i = 0;
  while(len--) {
    var prop = props[i];
    iterator(prop, i, props);
    i++;
  }
  return props;
}
