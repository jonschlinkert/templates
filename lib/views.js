'use strict';

var define = require('define-property');
var Base = require('base-methods');
var Vinyl = require('vinyl');

function Views(options) {
  Base.call(this);
  this.options = options || {};
  this.define('View', this.options.View || Vinyl);
  delete this.options.View;
  this.views = {};
  this.keys = [];
}
Base.extend(Views);

Views.prototype.addView = function(key, value) {
  if (typeof value !== 'object') {
    throw new TypeError('expected value to be an object.');
  }

  var view = !(value instanceof this.View)
    ? new this.View(value)
    : value;

  view.key = this.renameKey(view.key || key);
  this.views[view.key] = view;
  return this;
};

Views.prototype.addViews = function(views) {
  for (var key in views) this.addView(key, views[key]);
  return this;
};

Views.prototype.getView = function(key) {
  return this.views[key] || this.views[this.renameKey(key)];
};

Views.prototype.renameKey = function(key) {
  if (typeof this.options.renameKey === 'function') {
    return this.options.renameKey.call(this, key);
  }
  return key;
};

define(Views.prototype, 'count', {
  get: function() {
    return Object.keys(this.views).length;
  },
  set: function () {
    throw new Error('count is a read-only getter and cannot be defined.');
  }
});

module.exports = Views;
