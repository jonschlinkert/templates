'use strict';

var utils = require('./utils');
var Item = require('./item');

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
  Item.call(this, view);
  delete this.isItem;
  this.isView = true;
  this.define('_name', 'View');
}

/**
 * Inherit `Item`
 */

Item.extend(View);

View.prototype.renameKey = function(key) {
  if (typeof this.options.renameKey === 'function') {
    return this.options.renameKey(key, this);
  }
  return key;
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

View.prototype.compile = function (settings) {
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

View.prototype.render = function (locals, cb) {
  if (typeof locals === 'function') return this.render({}, locals);
  if (typeof this.fn !== 'function') this.compile(locals);

  this.locals = utils.merge({}, this.locals, locals);
  var context = utils.merge({}, this.locals, this.data);
  for (var key in this) {
    if (this.hasOwnProperty(key)) {
      context[key] = context[key] || this[key];
    }
  }

  context.path = this.path;

  utils.engine.render(this.fn, context, function (err, res) {
    if (err) return cb(err);
    this.contents = new Buffer(res);
    cb(null, this);
  }.bind(this));
  return this;
};

/**
 * Ensure that the `layout` property is set on a view.
 */

utils.define(View.prototype, 'layout', {
  set: function (val) {
    this.define('_layout', val);
  },
  get: function () {
    return this._layout || utils.resolveLayout(this);
  }
});

/**
 * Expose `View`
 */

module.exports = View;
