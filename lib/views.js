'use strict';

var Base = require('base-methods');
var utils = require('./utils');

function Views(options) {
  Base.call(this);
  this.options = options || {};
  this.define('View', this.options.View || require('./view'));
  utils.renameKey(this);
  this.views = {};
}

Base.extend(Views, {
  use: function(fn) {
    return fn(this);
  },

  addView: function(key, value) {
    if (!value && typeof key === 'string') {
      return this.addView(this.renameKey(key), {path: key});
    }

    if (typeof value !== 'object') {
      throw new TypeError('expected value to be an object.');
    }

    var View = this.get('View');
    var view = !(value instanceof this.View)
      ? new View(value)
      : value;

    if (view.hasOwnProperty('options')) {
      this.option(view.options);
    }

    view.path = view.path || key;
    view.key = this.renameKey(view.key || key);

    var val = this.decorateView(view);
    this.emit('view', view.key, val);
    this.views[view.key] = val;
    return view;
  },

  addViews: function(views) {
    if (arguments.length > 1 && utils.isView(arguments[1])) {
      return this.addView.apply(this, arguments);
    }
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
    this.emit('option', key, value);
    return this;
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
