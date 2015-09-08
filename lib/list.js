'use strict';

var define = require('define-property');
var Base = require('base-methods');
var Views = require('./views');
var Vinyl = require('vinyl');

function List(options) {
  Base.call(this);
  this.options = options || {};
  this.define('View', this.options.View || Vinyl);
  this.define('Item', this.options.Item || Vinyl);
  this.views = [];
  this.keys = [];
  if (options instanceof Views) {
    this.addViews(options.views);
  }
}
Base.extend(List);

List.prototype.addView = function(key, value) {
  if (typeof value !== 'object') {
    throw new TypeError('expected value to be an object.');
  }

  var view = !(value instanceof this.View)
    ? new this.View(value)
    : value;

  view.key = this.renameKey(view.key || key);
  this.keys.push(view.key);
  this.views.push(view);
  return this;
};

List.prototype.addViews = function(views) {
  for (var key in views) this.addView(key, views[key]);
  return this;
};

List.prototype.getIndex = function(key) {
  return this.keys.indexOf(this.renameKey(key));
};

List.prototype.getView = function(key) {
  return this.views[this.getIndex(key)];
};

List.prototype.renameKey = function(key) {
  if (typeof this.options.renameKey === 'function') {
    return this.options.renameKey.call(this, key);
  }
  return key;
};

define(List.prototype, 'count', {
  get: function() {
    return this.views.length;
  },
  set: function () {
    throw new Error('count is a read-only getter and cannot be defined.');
  }
});

module.exports = List;
