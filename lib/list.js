'use strict';

var define = require('define-property');
var sortBy = require('array-sort');
var Base = require('base-methods');
var utils = require('./utils');
var Views = require('./views');
var View = require('./view');
var Vinyl = require('vinyl');

function List(options) {
  Base.call(this);
  this.options = options || {};
  this.define('Item', this.options.Item || Vinyl);
  this.items = [];
  this.keys = [];

  if (options instanceof Views) {
    this.addItems(options.views);
  }
}

Base.extend(List);

List.prototype.use = function(fn) {
  fn.call(this, this, this.options);
  return this;
};

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

List.prototype.addList = function(list, fn) {
  fn = typeof fn === 'function' ? fn : utils.identity;
  var len = list.length, i = -1;
  while (++i < len) {
    var item = list[i];
    fn(item);
    this.addItem(item.path, item);
  }
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

List.prototype.sort = function() {
  var args = [].slice.call(arguments);
  var last = args[args.length - 1];
  var opts = this.options;

  if (last && typeof last === 'object' && !Array.isArray(last)) {
    opts = utils.merge({}, opts, args.pop());
  }

  args.unshift(this.items);
  args.push(opts);

  this.items = sortBy.apply(sortBy, args);

  var len = this.items.length, i = -1;
  this.keys = new Array(len);

  while (++i < len) {
    this.keys[i] = this.items[i].key;
  }
  return this;
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
