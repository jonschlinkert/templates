'use strict';

var utils = require('../utils');

/**
 * Decorate an `item` or `view` method onto an `app` or
 * `collection` instance.
 */

module.exports = function(method, CtorName) {
  return function(app) {

    /**
     * Returns a new item, using the `Item` class
     * currently defined on the instance.
     *
     * ```js
     * var item = app.item('foo', {conetent: '...'});
     * // or
     * var item = app.item({path: 'foo', conetent: '...'});
     * ```
     * @name .item
     * @param {String|Object} `key` Item key or object
     * @param {Object} `value` If key is a string, value is the item object.
     * @return {Object} returns the `item` object
     * @api public
     */

    app.define(method, function(key, value) {
      if (!value && typeof key === 'string') {
        return this[method](this.renameKey(key), {path: key});
      }

      if (utils.isObject(key) && key.path) {
        return this[method](key.path, key);
      }

      if (typeof value === 'string') {
        value = { content: value };
      }

      if (typeof value !== 'object') {
        throw new TypeError('expected value to be an object.');
      }

      var Item = this.get(CtorName);
      var item = !(value instanceof Item)
        ? new Item(value)
        : value;

      // prime commonly needed objects on `item`
      item.options = item.options || value.options || {};
      item.locals = item.locals || value.locals || {};
      item.data = item.data || value.data || {};

      // get renameKey fn if defined on item opts
      if (item.options && item.options.renameKey) {
        this.option('renameKey', item.options.renameKey);
      }

      item.key = this.renameKey(item.key || key);
      item.path = item.path || key;

      // get the collection name (singular form)
      var collectionName = item.options.inflection || this.options.inflection;

      // set the collection name on the item
      // so instead of `<View <buffer>>` we'll see `<Page <buffer>>`
      if (collectionName || app._name) {
        utils.isName(item, collectionName || app._name, true);
      }

      // emit the item, collection name, and collection instance
      // `app.on('view', ...)`
      this.emit(method, item, collectionName, this);
      return item;
    });
  };
};
