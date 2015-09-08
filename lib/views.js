'use strict';

var Base = require('base-methods');
var utils = require('./utils');
var View = require('./view');

function Views(options) {
  Base.call(this);
  this.options = options || {};
  this.define('View', this.options.View || View);
  this.views = {};
}

Base.extend(Views, {
  use: function(fn) {
    fn(this);
    return this;
  },

  addView: function(key, value) {
    if (!value && typeof key === 'string') {
      return this.addView(this.renameKey(key), {path: key});
    }

    if (typeof value !== 'object') {
      throw new TypeError('expected value to be an object.');
    }

    var view = !(value instanceof this.View)
      ? new this.View(value)
      : value;

    view.key = this.renameKey(view.key || key);
    view.path = view.path || key;

    this.views[view.key] = this.decorateView(view, key, value);
    return view;
  },

  addViews: function(views) {
    this.visit('addView', this.loader(views));
    return this;
  },

  getView: function(key) {
    return this.views[key] || this.views[this.renameKey(key)];
  },

  decorateView: function(view) {
    return view;
  },

  loader: function(views) {
    return views;
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
  },

  /**
   * Set view types for the collection.
   *
   * @param {String} `plural` e.g. `pages`
   * @param {Object} `options`
   * @api private
   */

  viewType: function() {
    this.options.viewType = utils.arrayify(this.options.viewType || []);
    if (this.options.viewType.length === 0) {
      this.options.viewType.push('renderable');
    }
    return this.options.viewType;
  }
});

utils.define(Views.prototype, 'count', {
  get: function() {
    return Object.keys(this.views).length;
  },
  set: function () {
    throw new Error('count is a read-only getter and cannot be defined.');
  }
});

module.exports = Views;
