'use strict';

var Base = require('base-methods');
var utils = require('./utils');

/**
 * Create an instance of `Group` with the given `options`.
 *
 * ```js
 * var group = new Group({
 *   'foo': {
 *     items: [1,2,3]
 *    }
 * });
 * ```
 * @param {Object} `options`
 * @api public
 */

function Group(options) {
  Base.call(this, options);
  this.define('List', this.List || require('./list'));
  this.define('plugins', []);
}

/**
 * Inherit `Base`
 */

Base.extend(Group);

/**
 * Run a plugin on the group instance. Plugins
 * are invoked immediately upon creating the group
 * in the order in which they were defined.
 *
 * ```js
 * group.use(function(group) {
 *   // `group` is the instance, as is `this`
 * });
 * ```
 *
 * @param {Function} `fn` Plugin function.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Group.prototype.use = function(fn) {
  fn.call(this, this);
  this.emit('use');
  return this;
};

/**
 * Get a value from the group instance. If the value is an array,
 * it will be returned as a new `List`.
 *
 * @return {[type]}
 */

Group.prototype.get = function() {
  var res = Base.prototype.get.apply(this, arguments);
  if (Array.isArray(res)) {
    var List = this.List;
    var list = new List();
    list.addItems(res);
    return list;
  }
  handleErrors(this, res);
  return res;
};

/**
 * When `get` returns a non-Array object, we decorate
 * noop `List` methods onto the object to inform the
 * user that list methods do not work on groups.
 *
 * @param {Object} `group`
 * @param {Object} `val` Value returned from `group.get()`
 */

function handleErrors(group, val) {
  if (typeof val === 'object') {
    var List = group.List;
    var keys = Object.keys(List.prototype);

    keys.forEach(function(key) {
      if (typeof val[key] !== 'undefined') return;

      utils.define(val, key, function() {
        throw new Error(key + ' can only be used with an array of `List` items.');
      });
    });
  }
}

/**
 * Expose `Group`
 */

module.exports = Group;
