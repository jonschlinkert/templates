'use strict';

var Base = require('./base');
var utils = require('./utils');

/**
 * Expose `Group`
 */

module.exports = Group;

/**
 * Create an instance of `Group` with the given `options`.
 *
 * ```js
 * var group = new Group({
 *   'foo': { items: [1,2,3] }
 * });
 * ```
 * @param {Object} `options`
 * @api public
 */

function Group(options) {
  if (!(this instanceof Group)) {
    return new Group(options);
  }

  utils.isName(this, 'Group');
  Base.call(this, options);

  this.define('List', this.List || require('./list'));
  this.define('options', this.options);
  this.define('cache', this.cache);
}

/**
 * Inherit `Base`
 */

Base.extend(Group);

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
