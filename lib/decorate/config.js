'use strict';

var utils = require('../utils');

module.exports = function (proto) {

  /**
   * Set or get an option value.
   *
   * ```js
   * {%= type %}.option('a', 'b');
   * {%= type %}.option({c: 'd'});
   * console.log({%= type %}.options);
   * //=> {a: 'b', c: 'd'}
   * ```
   *
   * @name .option
   * @param {String|Object} `key` Pass a key-value pair or an object to set.
   * @param {any} `val` Any value when a key-value pair is passed. This can also be options if a glob pattern is passed as the first value.
   * @return {Object} Returns an instance of `Templates` for chaining.
   * @api public
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
