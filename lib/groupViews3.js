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
  if (arguments.length === 0) {
    return new this.List(this.views).items;
  }
  return this.views.groupBy.apply(this.views, arguments);
};

Group.prototype.create = function(name, props, options) {
  if (typeof props === 'object' && !Array.isArray(props)) {
    options = props;
    props = null;
  }
  var single = utils.single(name);
  var plural = utils.plural(name);
  var opts = utils.extend({
    listViews: this.listViews
  }, options);

  var collection = this.collections[name] = new this.Collection(opts);

  // add inflections to collection options
  collection.option('inflection', single);
  collection.option('plural', plural);

  props = utils.arrayify(props);
  if (props.length === 0 && opts.all !== true) {
    props.push(name);
  }

  var names = [];
  props.forEach(function(prop, idx) {
    if (typeof prop === 'string') {
      if (/^data\./.test(prop)) {
        names.push(prop.slice(5));
      } else {
        names.push(prop);
        props[idx] = `data.${prop}`;
      }
    }
  });

  if (names.length === 0) {
    names.push(name);
  }
  opts.names = names;

  var group = this.groupBy.apply(this, props);
  collection.addGroup(group, opts);

  return collection;
};
