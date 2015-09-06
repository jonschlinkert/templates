'use strict';

var define = require('define-property');
var Base = require('base-methods');
var Vinyl = require('vinyl');

function Collection(options) {
  Base.call(this);
  this.options = options || {};
  this.define('Item', this.options.Item || Vinyl);
  delete this.options.Item;
  this.items = {};
  this.keys = [];
}
Base.extend(Collection);

Collection.prototype.addItem = function(key, value) {
  if (typeof value !== 'object') {
    throw new TypeError('expected value to be an object.');
  }

  var item = !(value instanceof this.Item)
    ? new this.Item(value)
    : value;

  item.key = this.renameKey(item.key || key);
  this.items[item.key] = item;
  return this;
};

Collection.prototype.addItems = function(items) {
  for (var key in items) this.addItem(key, items[key]);
  return this;
};

Collection.prototype.getItem = function(key) {
  return this.items[key] || this.items[this.renameKey(key)];
};

Collection.prototype.renameKey = function(key) {
  if (typeof this.options.renameKey === 'function') {
    return this.options.renameKey.call(this, key);
  }
  return key;
};

define(Collection.prototype, 'count', {
  get: function() {
    return Object.keys(this.items).length;
  },
  set: function () {
    throw new Error('count is a read-only getter and cannot be defined.');
  }
});

module.exports = Collection;
