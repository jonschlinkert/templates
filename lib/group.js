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
 * var group = new Group({
 *   'foo': { items: [1,2,3] }
 * });
 * ```
 * @param {Object} `options`
 * @api public
 */

function Group(config) {
  if (!(this instanceof Group)) {
    return new Group(config);
  }

  Base.call(this, config);
  this.is('Group');
  this.use(utils.option());
  this.use(utils.plugin());
  this.init();
}

/**
 * Inherit `Base`
 */

Base.extend(Group);

/**
 * Initialize Group defaults. Makes `options` and `cache`
 * (inherited from `Base`) non-emumerable.
 */

Group.prototype.init = function() {
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

  this.define('cache', this.cache);
  this.define('List', this.List || require('./list'));
};

