'use strict';

var Base = require('base').namespace('groups');
var debug = require('debug')('base:templates:groups');
var utils = require('./utils');

/**
 * Expose `Groups`
 */

module.exports = exports = Groups;

/**
 * Create an instance of `Groups` with the given `config`.
 *
 * ```js
 * var groups = new Groups(config);
 * ```
 * @param {Object} `config` Config is an object returned from the `groupBy` method on List or Views.
 * @api public
 */

function Groups(config) {
  if (!(this instanceof Groups)) {
    return new Groups(config);
  }
  Base.call(this, config);
  this.is('Groups');
  this.use(utils.option());
  this.use(utils.plugin());

  this.define('cache', this.cache);
  this.define('groups', this.groups);
  this.define('options', this.options);
  this.define('List', this.List || require('./list'));

  this.define('keys', {
    get: function() {
      return Object.keys(this.groups);
    }
  });
}
Base.extend(Groups);

/**
 * Get a value from the group instance. If the value is an array,
 * it will be returned as a new `List`.
 */

Groups.prototype.get = function() {
  var res = Base.prototype.get.apply(this, arguments);
  if (Array.isArray(res)) {
    var List = this.List;
    var list = new List();
    list.addItems(res);
    return list;
  } else if (typeof res === 'object') {
    res = this.decorate(res);
  }
  handleErrors(this.List, res);
  return res;
};

/**
 * Static decorate method for other classes to use to create an instance
 * of groups from an object.
 *
 * ```js
 * var groups = Groups.decorate(app.pages.groupBy('data.tags'), app.List);
 * ```
 *
 * @param  {Object} `obj` Object returned from the `.groupBy` method.
 * @param  {Function} `List` List constructor function. This should be passed in when used as a static method.
 * @return {Object} Instance of Groups with decorated methods.
 * @api public
 */

Groups.decorate = function(obj, List) {
  if (obj instanceof Groups) {
    return obj;
  }
  var groups = new Groups(obj);
  groups.define('List', List || this.List);
  return groups;
};

/**
 * Decorate the object returned from `groupBy` with methods for getting
 * group information like `.keys` and turning arrays into instances of `List`.
 *
 * @param  {Object} `obj` Object to decorate
 * @return {Object} Decorated object with methods
 * @api public
 */

Groups.prototype.decorate = function(obj, List) {
  return Groups.decorate.call(this, obj, List);
};


/**
 * When `get` returns a non-Array object, we decorate
 * noop `List` methods onto the object to throw errors when list methods
 * are used, since list array methods do not work on groups.
 *
 * @param {Function} `List`
 * @param {Object} `val` Value returned from `groups.get()`
 */

function handleErrors(List, val) {
  if (utils.isObject(val)) {
    var keys = Object.keys(List.prototype);

    keys.forEach(function(key) {
      if (typeof val[key] !== 'undefined') return;

      utils.define(val, key, function() {
        throw new Error(key + ' can only be used with an array of `List` items.');
      });
    });
  }
}
