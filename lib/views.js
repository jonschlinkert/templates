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
plugin.lookup(Views.prototype);
plugin.errors(Views.prototype, 'Views');

/**
 * Initialize `Views` defaults
 */

Views.prototype.init = function(opts) {
  this.define('isCollection', true);
  this.define('isViews', true);

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
  if (view.use) this.run(view);

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

Views.prototype.getView = function(key) {
  var cwd = this.options.cwd || process.cwd();
  var view = this.views[key]
    || this.views[this.renameKey(key)]
    || this.views[path.resolve(cwd, key)]
    || this.views[path.relative(cwd, key)];

  if (!view) {
    var fp = path.join(cwd, key);
    if (fs.existsSync(fp)) {
      var str = fs.readFileSync(fp);
      this.addView(key, { contents: str });
      return this.getView(key);
    }
    return null;
  }
  return view;
};

/**
 * Decorate each view on the collection with additional methods
 * and properties. This provides a way of easily overriding
 * defaults.
 *
 * @param {Object} `view`
 * @return {Object}
 * @api public
 */

Views.prototype.extendView = function(view) {
  return plugin.view.all(this, view);
};

/**
 * Set view types for the collection.
 *
 * @param {String} `plural` e.g. `pages`
 * @param {Object} `options`
 * @api private
 */

Views.prototype.viewType = function() {
  this.options.viewType = utils.arrayify(this.options.viewType || []);
  if (this.options.viewType.length === 0) {
    this.options.viewType.push('renderable');
  }
  return this.options.viewType;
};
