'use strict';

var path = require('path');
var utils = require('./utils');
var Item = require('./item');

/**
 * Expose `View`
 */

module.exports = View;

/**
 * Create an instance of `View`. Optionally pass a default object
 * to use.
 *
 * ```js
 * var view = new View({
 *   path: 'foo.html',
 *   content: '...'
 * });
 * ```
 * @param {Object} `view`
 * @api public
 */

function View(view) {
  if (!(this instanceof View)) {
    return new View(view);
  }

  utils.isName(this, 'View');
  Item.call(this, view);
  delete this.isItem;
}

/**
 * Inherit `Item`
 */

Item.extend(View);

/**
 * Creates a context object from front-matter data, `view.locals`
 * and the given `locals` object.
 *
 * ```js
 * var ctx = page.context({foo: 'bar'});
 * ```
 *
 * @param  {Object} `locals` Optionally pass locals to the engine.
 * @return {Object} Returns the context object.
 * @api public
 */

View.prototype.context = function(locals) {
  return utils.merge({}, this.locals, this.data, locals);
};

/**
 * Synchronously compile a view.
 *
 * ```js
 * var view = page.compile();
 * view.fn({title: 'A'});
 * view.fn({title: 'B'});
 * view.fn({title: 'C'});
 * ```
 *
 * @param  {Object} `locals` Optionally pass locals to the engine.
 * @return {Object} `View` instance, for chaining.
 * @api public
 */

View.prototype.compile = function(settings) {
  this.fn = utils.engine.compile(this.content, settings);
  return this;
};

/**
 * Asynchronously render a view.
 *
 * ```js
 * view.render({title: 'Home'}, function(err, res) {
 *   //=> view object with rendered `content`
 * });
 * ```
 * @param  {Object} `locals` Optionally pass locals to the engine.
 * @return {Object} `View` instance, for chaining.
 * @api public
 */

View.prototype.render = function(locals, cb) {
  if (typeof locals === 'function') {
    return this.render({}, locals);
  }

  // if the view is not already compiled, do that first
  if (typeof this.fn !== 'function') {
    this.compile(locals);
  }

  var context = this.context(locals);
  context.path = this.path;

  utils.engine.render(this.fn, context, function(err, res) {
    if (err) return cb(err);
    this.contents = new Buffer(res);
    cb(null, this);
  }.bind(this));
  return this;
};

/**
 * Return true if the view is the given view `type`. Since
 * types are assigned by collections, views that are "collection-less"
 * will not have a type, and thus will always return `false` (as
 * expected).
 *
 * ```js
 * view.isType('partial');
 * ```
 * @param {String} `type` (`renderable`, `partial`, `layout`)
 * @api public
 */

View.prototype.isType = function(type) {
  this.options = this.options || {};
  if (!this.options.viewType) {
    this.options.viewType = [];
  }
  return this.options.viewType.indexOf(type) !== -1;
};

/**
 * Ensure that the `layout` property is set on a view.
 */

utils.define(View.prototype, 'layout', {
  set: function(val) {
    this.define('_layout', val);
  },
  get: function() {
    return this._layout || utils.resolveLayout(this);
  }
});

/**
 * Ensure that the `engine` property is set on a view.
 */

utils.define(View.prototype, 'engine', {
  set: function(val) {
    this.define('_engine', val);
  },
  get: function() {
    return this._engine || resolveEngine(this);
  }
});

/**
 * Resolve the name of the engine to use, or the file
 * extension to use for identifying the engine.
 *
 * @param {Object} `view`
 * @return {String}
 */

function resolveEngine(view) {
  var engine = view.options.engine || view.locals.engine || view.data.engine;
  if (!engine) {
    engine = path.extname(view.path);
    view.data.ext = engine;
  }
  return engine;
}
