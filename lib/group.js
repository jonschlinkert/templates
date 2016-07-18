'use strict';

var Base = require('base');
var debug = require('debug')('base:templates:group');
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

/**
 * Group all view collection `items` using the given property,
 * properties or compare functions. See [group-array][]
 * for the full range of available features and options.
 *
 * ```js
 * var group = new Group(app.posts);
 * var groups = group.groupBy('data.date', 'data.slug');
 * ```
 * @return {Object} Returns the grouped items.
 * @api public
 */

Group.prototype.groupBy = function() {
  if (arguments.length === 0) {
    var group = {};
    group[this.views.options.collection] = (new this.List(this.views)).items;
    return group;
  }
  return this.views.groupBy.apply(this.views, arguments);
};

/**
 * Create a new collection of grouped items using the given property array.
 * The collection will be created and cached on the `.collections` object.
 *
 * ```js
 * group.create('tags', ['tags']);
 * ```
 *
 * @param  {String}   `name` Name of the collection to create.
 * @param  {Array}    ` props` Array of property names to be grouped by. These are properties that are on the view collection's items data object. When no properties are given, then the name is used.
 * @param  {Object}   `options` Additional options to control grouping and pagination.
 * @param  {Boolean}  `options.all` Use this when not passing in the `props` array to group all of the view collection`s items into a single list.
 * @param  {Object}   `options.paginate` Pagination options to pass to [List#paginate](#List) to create paginated item index pages.
 * @param  {Function} `options.permalinks` When specified, the function will be passed to the new collection as a plugin to allow for setting up permalinks.
 * @return {Object}   Collection instance.
 * @api public
 */

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
