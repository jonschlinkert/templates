'use strict';

var Base = require('base-methods');
var utils = require('./utils');

function Views(options) {
  Base.call(this);
  options = options || {};
  this.define('List', options.List || require('./list'));
  this.define('View', options.View || require('./view'));
  utils.renameKey(this);
  utils.option(this);
  this.views = {};

  if (options instanceof this.List) {
    this.addList(options.items);
  } else {
    this.options = options;
  }
}

Base.extend(Views, {
  use: function(fn) {
    fn.call(this, this);
    return this;
  },

  view: function (key, value) {
    if (typeof value !== 'object' && typeof key === 'string') {
      return this.view(this.renameKey(key), {path: key});
    }

    if (utils.isObject(key) && key.path) {
      return this.view(key.path, key);
    }

    if (typeof value !== 'object') {
      throw new TypeError('expected value to be an object.');
    }

    var View = this.get('View');
    var view = !(value instanceof View)
      ? new View(value)
      : value;

    // get renameKey fn if defined on view opts
    if (view.options && view.options.renameKey) {
      this.option('renameKey', view.options.renameKey);
    }

    view.path = view.path || key;
    view.key = this.renameKey(view.key || key);
    return this.extendView(view);
  },

  addView: function(key, value) {
    var view = this.view(key, value);
    this.emit('view', view.key, view);
    this.views[view.key] = view;
    return view;
  },

  addViews: function(views, fn) {
    if (Array.isArray(views)) {
      return this.addList.apply(this, arguments);
    }
    if (arguments.length > 1 && utils.isView(arguments[1])) {
      return this.addView.apply(this, arguments);
    }
    if (typeof fn !== 'function') {
      fn = utils.identity;
    }
    this.visit('addView', this.loader(views, fn));
    return this;
  },

  addList: function(list, fn) {
    if (typeof fn !== 'function') {
      fn = utils.identity;
    }
    var len = list.length, i = -1;
    while (++i < len) {
      var view = list[i];
      fn(view);
      this.addView(view.path, view);
    }
    return this;
  },

  getView: function(key) {
    return this.views[key] || this.views[this.renameKey(key)];
  },

  extendView: function(view) {
    view.options = view.options || {};
    view.options.plural = this.options.plural;
    view.options.inflection = this.options.inflection;
    return view;
  },

  loader: function(views) {
    return views;
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

/**
 * Expose `Views`
 */

module.exports = Views;
