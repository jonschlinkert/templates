'use strict';

var utils = require('../utils');

module.exports = function (proto) {

  /**
   * Set, get and load data to be passed to templates as
   * context at render-time.
   *
   * ```js
   * app.data('a', 'b');
   * app.data({c: 'd'});
   * console.log(app.cache.data);
   * //=> {a: 'b', c: 'd'}
   * ```
   *
   * @name .data
   * @param {String|Object} `key` Pass a key-value pair or an object to set.
   * @param {any} `val` Any value when a key-value pair is passed. This can also be options if a glob pattern is passed as the first value.
   * @return {Object} Returns an instance of `Templates` for chaining.
   * @api public
   */

  proto.data = function (key, val) {
    if (utils.isObject(key)) {
      this.visit('data', key);
      return this;
    }

    var isGlob = typeof val === 'undefined' || utils.hasGlob(key);
    if (utils.isValidGlob(key) && isGlob) {
      var opts = utils.extend({}, this.options, val);
      var data = utils.requireData(key, opts);
      if (data) this.visit('data', data);
      return this;
    }

    key = 'cache.data.' + key;
    this.set(key, val);
    return this;
  };

  /**
   * Set or get an option value. This is a factory for
   * adding an `option` method to a class
   */

  proto.option = function(key, value) {
    if (typeof key === 'string') {
      if (arguments.length === 1) {
        return this.get('options.' + key);
      }
      this.set('options.' + key, value);
      this.emit('option', key, value);
      return this;
    }
    if (typeof key !== 'object') {
      throw new TypeError('expected a string or object.');
    }
    this.visit('option', key);
    return this;
  };
};
