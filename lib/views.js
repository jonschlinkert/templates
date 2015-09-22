'use strict';

var fs = require('fs');
var path = require('path');
var Base = require('base-methods');
var decorate = require('./decorate');
var utils = require('./utils');

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
  Base.call(this);
  options = options || {};

  // decorate the instance
  utils.renameKey(this);
  decorate.init(this);

  // add constructors
  this.define('List', options.List || require('./list'));
  this.define('View', options.View || require('./view'));
  this.define('loaded', false);
  this.define('plugins', []);

  this.isCollection = true;
  this.queue = [];
  this.views = {};

  // if an instance of `List` of `Views` is passed, load it now
  if (Array.isArray(options) || options instanceof this.List) {
    this.options = options.options;
    this.addList(options.items);

  } else if (options instanceof Views) {
    this.options = options.options;
    this.addViews(options.views);

  } else {
    this.options = options;
  }
}

Base.extend(Views);

decorate.config(Views.prototype);
decorate.routes(Views.prototype);
decorate.engine(Views.prototype);
decorate.context(Views.prototype);
decorate.helpers(Views.prototype);
decorate.layout(Views.prototype);
decorate.render(Views.prototype);
decorate.lookup(Views.prototype);
decorate.errors(Views.prototype, 'Views');

/**
 * Run a plugin on the collection instance. Plugins
 * are invoked immediately upon creating the collection
 * in the order in which they were defined.
 *
 * ```js
 * collection.use(function(views) {
 *   // `views` is the instance, as is `this`
 *
 *   // optionally return a function to be passed to
 *   // the `.use` method of each view created on the
 *   // instance
 *   return function(view) {
 *     // do stuff to each `view`
 *   };
 * });
 * ```
 *
 * @param {Function} `fn` Plugin function. If the plugin returns a function it will be passed to the `use` method of each view created on the instance.
 * @return {Object} Returns the instance for chaining.
 * @api public
 */

Views.prototype.use = function(fn) {
  var plugin = fn.call(this, this, this.options);
  if (typeof plugin === 'function') {
    this.plugins.push(plugin);
  }
  this.emit('use');
  return this;
};

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

utils.itemFactory(Views.prototype, 'view', 'View');

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
  this.views[view.key] = view;
  return view;
};

/**
 * Adds event emitting and custom loading to [setView](#setView).
 *
 * @param {String} `key`
 * @param {Object} `value`
 * @api public
 */

Views.prototype.addView = function(key, value) {
  var args = [].slice.call(arguments);
  this.emit.apply(this, ['addView'].concat(args));

  var view = this.setView(key, value);
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
  if (Array.isArray(views)) {
    return this.addList.apply(this, arguments);
  }
  if (arguments.length > 1 && utils.isView(arguments[1])) {
    return this.addView.apply(this, arguments);
  }

  this.emit('addViews', views);
  if (this.loaded) return this;

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

Views.prototype.addList = function(list) {
  this.emit('addList', list);
  if (this.loaded) return this;

  if (!Array.isArray(list)) {
    throw new TypeError('expected list to be an array.');
  }

  var len = list.length, i = -1;
  while (++i < len) {
    var view = list[i];
    this.addView(view.path, view);
  }
  return this;
};

/**
 * Loads and create a new `View` from the file system.
 *
 * @param {String} `filename`
 * @param {Object} `options`
 * @return {Object} Returns view object
 * @api public
 */

Views.prototype.loadView = function(filename, options) {
  var opts = utils.merge({}, this.options, options);
  var View = this.get('View');

  var extname = path.extname(filename);
  var name = path.basename(filename, extname);
  var fp = path.resolve(opts.cwd, name);
  var ext = opts.ext || extname || '';
  var str = utils.tryRead(fp + ext) || utils.tryRead(fp);

  var view = new View({
    path: fp + ext,
    name: name,
    ext: ext,
    content: str
  });

  return this.addView(view);
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
  return this.views[key] || this.views[this.renameKey(key)];
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
  decorate.view.all(this, view);
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

/**
 * Expose `Views`
 */

module.exports = Views;
