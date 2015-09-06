'use strict';

var Base = require('base-methods');
var define = require('define-property');
var View = require('./view');

function Views(options) {
  Base.call(this);
  this.options = options || {};
  this.define('View', this.options.View || View);
  delete this.options.View;
  this.views = {};
  this.keys = [];
}

Base.extend(Views, {
  addView: function(key, value) {
    if (arguments.length === 1 && typeof key === 'string') {
      this.addView(this.renameKey(key), {path: key});
      return this;
    }

    if (typeof value !== 'object') {
      throw new TypeError('expected value to be an object.');
    }

    var view = !(value instanceof this.View)
      ? new this.View(value)
      : value;

    view.key = this.renameKey(view.key || key);
    this.views[view.key] = view;
    return view;
    // return this;
  },

  addViews: function(views) {
    this.visit('addView', views);
    return this;
  },

  getView: function(key) {
    return this.views[key] || this.views[this.renameKey(key)];
  },

  option: function(key, value) {
    if (arguments.length === 1) {
      if (typeof key === 'string') {
        return this.get('options.' + key);
      }
      if (typeof key === 'object') {
        this.visit('option', key);
        return this;
      }
    }
    this.set('options.' + key, value);
    return this;
  },

  renameKey: function(key) {
    if (typeof this.options.renameKey === 'function') {
      return this.options.renameKey.call(this, key);
    }
    return key;
  }
});

define(Views.prototype, 'count', {
  get: function() {
    return Object.keys(this.views).length;
  },
  set: function () {
    throw new Error('count is a read-only getter and cannot be defined.');
  }
});

module.exports = Views;
