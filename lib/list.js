'use strict';

var define = require('define-property');
var Base = require('base-methods');
var Vinyl = require('vinyl');

function List(options) {
  Base.call(this);
  this.options = options || {};
  this.define('Item', this.options.Item || Vinyl);
  delete this.options.Item;
  this.items = [];
  this.keys = [];
}
Base.extend(List);

List.prototype.addItem = function(key, value) {
  if (typeof value !== 'object') {
    throw new TypeError('expected value to be an object.');
  }

  var item = !(value instanceof this.Item)
    ? new this.Item(value)
    : value;

  item.key = this.renameKey(item.key || key);
  this.keys.push(item.key);
  this.items.push(item);
  return this;
};

List.prototype.addItems = function(items) {
  for (var key in items) this.addItem(key, items[key]);
  return this;
};

List.prototype.getIndex = function(key) {
  return this.keys.indexOf(this.renameKey(key));
};

List.prototype.getItem = function(key) {
  return this.items[this.getIndex(key)];
};

List.prototype.renameKey = function(key) {
  if (typeof this.options.renameKey === 'function') {
    return this.options.renameKey.call(this, key);
  }
  return key;
};

define(List.prototype, 'count', {
  get: function() {
    return this.items.length;
  },
  set: function () {
    throw new Error('count is a read-only getter and cannot be defined.');
  }
});

module.exports = List;
