'use strict';

var Base = require('base');
var debug = require('debug')('base:templates:group-views');
var utils = require('./utils');

/**
 * Expose `Group`
 */

module.exports = exports = Group;

/**
 * Create an instance of `Group` with the given `options`.
 *
 * ```js
 * var group = new Group(views, listViews);
 * ```
 * @param {Object} `views` View collection containing the views to group.
 * @param {Object} `listViews` View collection containing index and list views used for rendering groups.
 * @api public
 */

function Group(views, listViews) {
  if (!(this instanceof Group)) {
    return new Group(views, listViews);
  }

  Base.call(this);
  this.is('Group');
  this.use(utils.option());
  this.use(utils.plugin());
  this.init(views, listViews);
}

/**
 * Inherit `Base`
 */

Base.extend(Group);

/**
 * Initialize Group defaults. Makes `options` and `cache`
 * (inherited from `Base`) non-emumerable.
 */

Group.prototype.init = function(views, listViews) {
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

  this.define('collections', {});
  this.define('cache', this.cache);
  this.define('List', this.List || require('./list'));
  this.define('Collection', this.Collection || require('./collection'));

  this.define('views', views);
  this.define('listViews', listViews);
};

Group.prototype.groupBy = function() {
  return this.views.groupBy.apply(this.views, arguments);
};

Group.prototype.create = function(name, props, options) {
  if (typeof props === 'object' && !Array.isArray(props)) {
    options = props;
    props = null;
  }
  var opts = utils.extend({}, options);
  props = utils.arrayify(props);
  if (props.length === 0 && opts.all !== true) {
    props.push(name);
  }

  var collection = (this.collections[name] || (this.collections[name] = new this.Collection(opts)));

  // add inflections to collection options
  collection.option('inflection', utils.single(name));
  collection.option('plural', utils.plural(name));

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

  var group;
  if (props.length === 0) {
    group = new this.List(this.views).items;
    names.push(name);
  } else {
    group = this.groupBy.apply(this, props);
  }

  var len = names.length;

  var createGroupPage = function(name, namespace, config) {
    var listView = this.listViews.getView(name);
    var fp = `${namespace}/index${listView.extname}`;
    return collection.addItem(fp, {contents: listView.contents});
  }.bind(this);

  var createGroupIndexPages = function(name, namespace, items) {
    if (typeof opts.paginate === 'undefined') {
      var index = createGroupPage(name, namespace, items);
      index.data.items = items;
      return index;
    }

    var listView = this.listViews.getView(name);
    var list = new this.List(items);
    var pages = list.paginate(opts.paginate);
    var first;
    pages.forEach(function(page) {
      var fp = `${namespace}/page/${page.idx}/index${listView.extname}`;
      var item = collection.addItem(fp, {contents: listView.contents});
      item.data.pagination = page;
      item.data.items = page.items;
      if (!first) first = item;
    });
    return first;
  }.bind(this);

  var createItemListPage = function(name, single, plural, namespace, config, idx) {
    var itemView = this.listViews.getView(single);
    var fp = `${namespace}${itemView.extname}`;
    var item = collection.addItem(fp, {contents: itemView.contents});

    if (Array.isArray(config)) {
      item.data.items = config;
    } else {
      item.data[single] = name;
      item.data[names[idx + 1]] = config;
      createCollection(idx + 1, `${namespace}`, config);
    }
    return item;
  }.bind(this);

  var createItemListIndexPages = function(name, single, plural, namespace, items, idx) {
    if (typeof opts.paginate === 'undefined') {
      var item = createItemListPage(name, single, plural, namespace, items, idx);
      return item;
    }

    var itemView = this.listViews.getView(single);
    var list = new this.List(items);
    var pages = list.paginate(opts.paginate);
    var first;
    pages.forEach(function(page) {
      var fp = `${namespace}/page/${page.idx}/index${itemView.extname}`;
      var item = collection.addItem(fp, {contents: itemView.contents});
      item.data.pagination = page;
      item.data.items = page.items;
      if (!first) first = item;
    });
    return first;
  }.bind(this);

  var createCollection = function(idx, namespace, config) {
    if (idx >= len) return;
    var prop = names[idx];
    namespace = namespace.length === 0 ? prop : (namespace + '/' + prop);

    var plural = utils.plural(prop);
    var single = utils.single(prop);

    if (Array.isArray(config)) {
      createGroupIndexPages(plural, namespace, config);
      return;
    }

    var index = createGroupPage(plural, namespace, config);
    var list = index.data[plural] = {};

    var keys = Object.keys(config);
    keys.forEach(function(key) {
      if (Array.isArray(config[key])) {
        list[key] = createItemListIndexPages(key, single, plural, `${namespace}/${key}`, config[key], idx);
        return;
      }
      list[key] = createItemListPage(key, single, plural, `${namespace}/${key}`, config[key], idx);
    });
  }.bind(this);

  createCollection(0, '', group);

  return collection;
};

function normalize(props, iterator) {
  var len = props.length, i = 0;
  while(len--) {
    var prop = props[i];
    iterator(prop, i, props);
    i++;
  }
  return props;
}
