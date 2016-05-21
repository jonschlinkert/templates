'use strict';

var utils = require('../utils');

/**
 * Decorate an `item` or `view` method onto an `app` or
 * `collection` instance.
 *
 * ```js
 * // register the plugin, define the method name to use
 * // and the constructor name to use when inspected
 * app.use(item('view', 'View'));
 * ```
 */

module.exports = function(method, CtorName) {
  return function(app) {

    /**
     * Returns a new item, using the `Item` class currently defined on the instance.
     *
     * ```js
     * var view = app.view('foo', {content: '...'});
     * // or
     * var view = app.view({path: 'foo', content: '...'});
     * ```
     * @name .item
     * @param {String|Object} `key` Item key or object
     * @param {Object} `value` If key is a string, value is the item object.
     * @return {Object} returns the `item` object
     * @api public
     */

    this.define(method, function(key, value) {
      if (!value && typeof key === 'string') {
        value = { path: key };
      }

      if (utils.isObject(key) && key.path) {
        value = key;
        key = value.path;
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

      if (typeof item.is === 'function') {
        item.is(CtorName);
      }

      // prime commonly needed objects on `item`
      item.options = item.options || value.options || {};
      item.locals = item.locals || value.locals || {};
      item.data = item.data || value.data || {};

      // get renameKey fn if defined on item opts
      if (item.options && typeof item.options.renameKey === 'function') {
        this.option('renameKey', item.options.renameKey);
      }

      item.path = item.path || key;
      item.key = this.renameKey.call(this, item.key || key, item);

      // get the collection name (singular form)
      var collectionName = item.options.inflection || this.options.inflection;
      item.options.collection = item.options.collection || this.options.plural;
      item.options.inflection = collectionName;

      // prime the object to use for caching locals and compiled functions
      utils.define(item, 'engineStack', {});
      utils.define(item, 'localsStack', []);

      // emit the item, collection name, and collection instance (`app.on('view', ...)`)
      this.emit(method, item, item.options.collection, this);

      // if `isApp`, run plugins on `item`, otherwise this is handled by collections
      if (app.isApp) {
        app.run(item);
      }

      return item;
    });
  };
};
