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

GroupViews.prototype.create = function(name, props, config) {

  var collection = (this.collections[name] || (this.collections[name] = new this.Collection()));
  // add inflections to collection options
  collection.option('inflection', utils.single(name));
  collection.option('plural', utils.plural(name));

  var len = props.length;

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
      item.data[props[idx + 1]] = config;
      next(idx + 1, `${namespace}`, config);
    }
    return item;
  }.bind(this);

  var next = function(idx, namespace, config) {
    if (idx >= len) return;
    var prop = props[idx];
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

  next(0, '', config);

  // var keys = Object.keys(config);
  // var fp = `${plural}/index${listView.extname}`;
  // if (parent) {
  //   fp = `${parent.options.collection}/${parent.data[parent.options.inflection]}/${fp}`;
  // }
  // var index = collection.addItem(fp, {contents: listView.contents, data: {inflection: single, plural: plural}});
  // var list = index.data[plural] = {};

  // keys.forEach(function(key) {
  //   var fp = `${plural}/${key}${itemView.extname}`;
  //   if (parent) {
  //     fp = `${parent.options.collection}/${parent.data[parent.options.inflection]}/${fp}`;
  //   }
  //   var item = collection.addItem(fp, {contents: itemView.contents, data: {inflection: single, plural: plural}});

  //   list[key] = item;
  //   if (Array.isArray(config[key])) {
  //     item.data[plural] = config[key];
  //   } else {
  //     item.data[single] = key;
  //     item.data[names[0]] = config[key];
  //     this.create(names.slice(0), config[key], item);
  //   }
  // }, this);
};

GroupViews.prototype.groupBy = function(name) {
  var props = [];
  var args = [].slice.call(arguments, 1);
  if (args.length === 0) {
    args.push(name);
  }

  var len = args.length, i = 0;
  while (len--) {
    var arg = args[i++];
    if (typeof arg === 'string') {
      if (/^data\./.test(arg)) {
        props.push(arg.slice(5));
      } else {
        props.push(arg);
        args[i-1] = `data.${arg}`;
      }
    }
  }

  var group = this.views.groupBy.apply(this.views, args);
  this.create(name, props, group);
  return group;
};
