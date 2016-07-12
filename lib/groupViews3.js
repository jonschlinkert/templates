'use strict';

var Base = require('base');
var debug = require('debug')('base:templates:group-views');
var utils = require('./utils');

/**
 * Expose `GroupViews`
 */

module.exports = exports = GroupViews;

/**
 * Create an instance of `GroupViews` with the given `options`.
 *
 * ```js
 * var group = new GroupViews(views, listViews);
 * ```
 * @param {Object} `views` View collection containing the views to group.
 * @param {Object} `listViews` View collection containing index and list views used for rendering groups.
 * @api public
 */

function GroupViews(views, listViews) {
  if (!(this instanceof GroupViews)) {
    return new GroupViews(views, listViews);
  }

  Base.call(this);
  this.is('GroupViews');
  this.use(utils.option());
  this.use(utils.plugin());
  this.init(views, listViews);
}

/**
 * Inherit `Base`
 */

Base.extend(GroupViews);

/**
 * Initialize GroupViews defaults. Makes `options` and `cache`
 * (inherited from `Base`) non-emumerable.
 */

GroupViews.prototype.init = function(views, listViews) {
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

GroupViews.prototype.create = function(name, props, options) {
  if (typeof props === 'object' && !Array.isArray(props)) {
    options = props;
    props = null;
  }
  var opts = utils.extend({}, options);
  props = utils.arrayify(props);
  if (props.length === 0) {
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

  var group = this.views.groupBy.apply(this.views, props);
  var len = names.length;

  var createIndex = function(name, namespace, config) {
    var listView = this.listViews.getView(name);
    var fp = `${namespace}/index${listView.extname}`;
    return collection.addItem(fp, {contents: listView.contents});
  }.bind(this);

  var createItem = function(name, single, plural, namespace, config, idx) {
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
