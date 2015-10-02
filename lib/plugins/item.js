'use strict';

var utils = require('../utils');


/**
 * Decorate an "item" method onto the given `collection` object.
 *
 * @param {Object} app
 */

module.exports = function (method, CtorName) {
  return function (app) {
    app.define(method, function(key, value) {
      if (typeof value !== 'object' && typeof key === 'string') {
        return this[method](this.renameKey(key), {path: key});
      }

      if (utils.isObject(key) && key.path) {
        return this[method](key.path, key);
      }

      if (typeof value !== 'object') {
        throw new TypeError('expected value to be an object.');
      }

      var Item = this.get(CtorName);
      var item = !(value instanceof Item)
        ? new Item(value)
        : value;

      item.options = item.options || value.options || {};
      item.locals = item.locals || value.locals || {};
      item.data = item.data || value.data || {};

      // get renameKey fn if defined on item opts
      if (item.options && item.options.renameKey) {
        this.option('renameKey', item.options.renameKey);
      }

      item.key = this.renameKey(item.key || key);
      item.path = item.path || key;

      this.plugins.forEach(function (fn) {
        item.use(fn);
      });

      this.emit(method, item, this);
      return item;
    });
  }
};
