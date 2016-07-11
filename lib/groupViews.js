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

GroupViews.prototype.create = function(names, config, parent) {
  names = utils.arrayify(names);
  if (names.length === 0) return;

  var name = names.shift();
  var plural = utils.plural(name);
  var single = utils.single(name);

  var listView = this.listViews.getView(plural);
  var itemView = this.listViews.getView(single);

  var collection = (this.collections[name] || (this.collections[name] = new this.Collection()));
  // add inflections to collection options
  collection.option('inflection', single);
  collection.option('plural', plural);

  var keys = Object.keys(config);
  var fp = `${plural}/index${listView.extname}`;
  if (parent) {
    fp = `${parent.options.collection}/${parent.data[parent.options.inflection]}/${fp}`;
  }
  var index = collection.addItem(fp, {contents: listView.contents, data: {inflection: single, plural: plural}});
  var list = index.data[plural] = {};

  keys.forEach(function(key) {
    var fp = `${plural}/${key}${itemView.extname}`;
    if (parent) {
      fp = `${parent.options.collection}/${parent.data[parent.options.inflection]}/${fp}`;
    }
    var item = collection.addItem(fp, {contents: itemView.contents, data: {inflection: single, plural: plural}});

    list[key] = item;
    if (Array.isArray(config[key])) {
      item.data[plural] = config[key];
    } else {
      item.data[single] = key;
      item.data[names[0]] = config[key];
      this.create(names.slice(0), config[key], item);
    }
  }, this);
};

GroupViews.prototype.groupBy = function() {
  var names = [];
  var args = [].slice.call(arguments);
  var len = args.length, i = 0;
  while (len--) {
    var arg = args[i++];
    if (typeof arg === 'string') {
      if (/^data\./.test(arg)) {
        names.push(arg.slice(5));
      } else {
        names.push(arg);
        args[i-1] = `data.${arg}`;
      }
    }
  }

  var group = this.views.groupBy.apply(this.views, args);
  this.create(names, group);
  return group;
};
