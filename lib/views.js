'use strict';

var Base = require('base-methods');
var utils = require('./utils');

function Views(options) {
  Base.call(this);
  options = options || {};
  utils.createView(this);
  utils.renameKey(this);
  utils.option(this);
  this.define('List', options.List || require('./list'));
  this.define('View', options.View || require('./view'));
  this.views = {};

  if (Array.isArray(options) || options instanceof this.List) {
    this.addList(options.items);

  } else if (options instanceof Views) {
    this.addViews(options.views);

  } else {
    this.options = options;
  }
}

Base.extend(Views, {
  use: function(fn) {
    fn.call(this, this);
    return this;
  },

  /**
   * Returns a new view, using the `View` class
   * currently defined on the instance.
   *
   * ```js
   * var view = app.view('foo', {conetent: '...'});
   * // or
   * var view = app.view({path: 'foo', conetent: '...'});
   * ```
   * @name .view
   * @param {String|Object} `key` View key or object
   * @param {Object} `value` If key is a string, value is the view object.
   * @return {Object} returns the `view` object
   * @api public
   */

  /**
   * Uses the `view` method to a view to the instance (collection).
   *
   * @name .addView
   * @param {String|Object} `key` View key or object
   * @param {Object} `value` If key is a string, value is the view object.
   * @return {Object} returns the `view` object
   * @api public
   */

  addView: function(key, value) {
    var view = this.view(key, value);
    this.emit('view', view.key, view);
    this.views[view.key] = view;
    return view;
  },

  addViews: function(views) {
    if (Array.isArray(views)) {
      return this.addList.apply(this, arguments);
    }
    if (arguments.length > 1 && utils.isView(arguments[1])) {
      return this.addView.apply(this, arguments);
    }
    this.visit('addView', this.loader(views));
    return this;
  },

  addList: function(list) {
    var len = list.length, i = -1;
    while (++i < len) {
      var view = list[i];
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
