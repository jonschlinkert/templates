'use strict';

var fs = require('fs');
var path = require('path');
var plugin = require('./plugins');
var utils = require('./utils');
var Base = require('./base');

/**
 * Expose `Views`
 */

module.exports = Views;

/**
 * Create an instance of `Views` with the given `options`.
 *
 * ```js
 * var collection = new Views();
 * collection.addView('foo', {content: 'bar'});
 * ```
 * @param {Object} `options`
 * @api public
 */

function Views(options) {
  if (!(this instanceof Views)) {
    return new Views(options);
  }

  utils.define(this, 'isCollection', true);
  utils.isName(this, 'Views');

  Base.call(this);
  this.init(options || {});
}

/**
 * Inherit `Base`
 */

Base.extend(Views);

/**
 * Mixin prototype methods
 */

plugin.routes(Views.prototype);
plugin.engine(Views.prototype);
plugin.layout(Views.prototype);
plugin.render(Views.prototype);
plugin.errors(Views.prototype, 'Views');

/**
 * Initialize `Views` defaults
 */

Views.prototype.init = function(opts) {
  // decorate the instance
  this.use(plugin.init);
  this.use(plugin.renameKey());
  this.use(plugin.context);
  this.use(plugin.helpers);
  this.use(plugin.item('view', 'View'));

  // add constructors
  this.define('List', opts.List || require('./list'));
  this.define('View', opts.View || require('./view'));
  this.define('loaded', false);

  this.queue = [];
  this.views = {};

  // if an instance of `List` of `Views` is passed, load it now
  if (Array.isArray(opts) || opts.isList) {
    this.options = opts.options || {};
    this.addList(opts.items || opts);

  } else if (opts.isCollection) {
    this.options = opts.options;
    this.addViews(opts.views);

  } else {
    this.options = opts;
  }
};

/**
 * Set a view on the collection. This is identical to [addView](#addView)
 * except `setView` does not emit an event for each view.
 *
 * ```js
 * collection.setView('foo', {content: 'bar'});
 * ```
 *
 * @param {String|Object} `key` View key or object
 * @param {Object} `value` If key is a string, value is the view object.
 * @developer This method is decorated onto the collection in the constructor using the `createView` utility method.
 * @return {Object} returns the `view` instance.
 * @api public
 */

Views.prototype.setView = function(key, value) {
  var view = this.view(key, value);
  this.setType(view);

  var name = this.options.inflection || 'none';
  if (view.use) this.run(view);

  this.emit('load', view);
  this.emit(name, view, this);

  this.views[view.key] = view;
  return view;
};

/**
 * Similar to [setView](#setView), adds a view to the collection
 * but also fires an event and iterates over the loading `queue`
 * for loading views from the `addView` event listener. If the
 * given view is not already an instance of `View`, it will be
 * converted to one before being added to the `views` object.
 *
 * ```js
 * var views = new Views(...);
 * views.addView('a.html', {path: 'a.html', contents: '...'});
 * ```
 * @param {String} `key`
 * @param {Object} `value`
 * @return {Object} Returns the instance of the created `View` to allow chaining view methods.
 * @api public
 */

Views.prototype.addView = function(/*key, value*/) {
  var args = [].slice.call(arguments);
  this.emit.call(this, 'addView', args);

  var view = this.setView.apply(this, args);
  while (this.queue.length) {
    this.setView(this.queue.shift());
  }
  this.extendView(view);
  return view;
};

/**
 * Load multiple views onto the collection.
 *
 * ```js
 * collection.addViews({
 *   'a.html': {content: '...'},
 *   'b.html': {content: '...'},
 *   'c.html': {content: '...'}
 * });
 * ```
 * @param {Object|Array} `views`
 * @return {Object} returns the `collection` object
 * @api public
 */

Views.prototype.addViews = function(views) {
  this.emit('addViews', views);
  if (this.loaded) return this;
  if (utils.hasGlob(views)) {
    throw new Error('glob patterns are not supported by addViews');
  }
  if (Array.isArray(views)) {
    this.addList.apply(this, arguments);
    return this;
  }
  if (arguments.length > 1 && utils.isView(arguments[1])) {
    this.addView.apply(this, arguments);
    return this;
  }
  this.visit('addView', views);
  return this;
};

/**
 * Load an array of views onto the collection.
 *
 * ```js
 * collection.addList([
 *   {path: 'a.html', content: '...'},
 *   {path: 'b.html', content: '...'},
 *   {path: 'c.html', content: '...'}
 * ]);
 * ```
 * @param {Array} `list`
 * @return {Object} returns the `views` instance
 * @api public
 */

Views.prototype.addList = function(list, fn) {
  this.emit('addList', list);
  if (this.loaded) return this;
  if (utils.hasGlob(list)) {
    throw new Error('glob patterns are not supported by addList');
  }
  if (!Array.isArray(list)) {
    throw new TypeError('expected list to be an array.');
  }
  if (typeof fn !== 'function') {
    fn = utils.identity;
  }
  var len = list.length, i = -1;
  while (++i < len) {
    var view = fn(list[i]);
    this.addView(view.path, view);
  }
  return this;
};

/**
 * Get a view from the collection.
 *
 * ```js
 * collection.getView('a.html');
 * ```
 * @param {String} `key` Key of the view to get.
 * @return {Object}
 * @api public
 */

Views.prototype.getView = function(name, options, fn) {
  if (typeof name !== 'string') {
    throw new TypeError('expected a string');
  }

  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  if (typeof fn === 'function') {
    name = fn.call(this, name, {});
  }

  var view = this.views[name] || this.views[this.renameKey(name)];
  if (view) return view;

  for (var key in this.views) {
    view = this.views[key];
    if (isMatch(name, view)) {
      return view;
    }
  }

  function isMatch(name, view) {
    if (name === view.path) return true;
    if (name === view.relative) return true;
    if (name === view.basename) return true;
    if (name === view.key) return true;
    if (name === view.stem) return true;

    var fp = path.resolve(view.path);
    return path.resolve(name) === fp;
  }

  if (fs.existsSync(name)) {
    return this.addView(name, {
      contents: fs.readFileSync(name)
    });
  }

  return '';
};

/**
 * Load a view from the file system.
 *
 * ```js
 * collection.loadView(view);
 * ```
 * @param {Object} `view`
 * @return {Object}
 * @api public
 */

Views.prototype.extendView = function(view) {
  return plugin.view.all(this, view);
};

/**
 * Decorate each view on the collection with additional methods
 * and properties. This provides a way of easily overriding
 * defaults.
 *
 * ```js
 * collection.extendView(view);
 * ```
 * @param {Object} `view`
 * @return {Object}
 * @api public
 */

Views.prototype.extendView = function(view) {
  return plugin.view.all(this, view);
};

/**
 * Return true if the collection belongs to the given
 * view `type`.
 *
 * ```js
 * collection.isType('partial');
 * ```
 * @param {String} `type` (`renderable`, `partial`, `layout`)
 * @api public
 */

Views.prototype.isType = function(type) {
  if (!this.options.viewType || !this.options.viewType.length) {
    this.viewType();
  }
  return this.options.viewType.indexOf(type) !== -1;
};

/**
 * Set view types for the collection.
 *
 * @param {String} `plural` e.g. `pages`
 * @param {Object} `options`
 */

Views.prototype.viewType = function(types) {
  this.options.viewType = utils.arrayify(this.options.viewType);
  types = utils.arrayify(types);
  var len = types.length;

  while (len--) {
    var type = types[len];
    if (['partial', 'layout', 'renderable'].indexOf(type) === -1) {
      throw new Error('"' + type + '" is not a valid viewType. Valid viewTypes are: partial, renderable and layout.');
    }

    if (this.options.viewType.indexOf(type) === -1) {
      this.options.viewType.push(type);
    }
  }

  if (this.options.viewType.length === 0) {
    this.options.viewType.push('renderable');
  }
  return this.options.viewType;
};

/**
 * Update the `options.viewType` property on a view.
 *
 * @param {Object} `view` The view to update
 */

Views.prototype.setType = function(view) {
  view.options = view.options || {};
  view.options.viewType = utils.arrayify(view.options.viewType);
  var types = this.viewType();
  var len = types.length;

  while (len--) {
    var type = types[len];
    if (view.options.viewType.indexOf(type) === -1) {
      view.options.viewType.push(type);
    }
  }
  view.options.viewType.sort();
};
