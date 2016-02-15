'use strict';

var debug = require('debug')('templates:helpers');
var utils = require('../utils');

module.exports = function(app, collection) {
  var single = collection.options.inflection;
  if (app.hasAsyncHelper(single)) return;

  var plural = collection.options.plural;

  /**
   * Create an async helper for getting a view from a collection.
   *
   * ```html
   * <%%= page("foo.tmpl") %>
   * ```
   * @param {String} `name` The name or path of the view to get.
   * @param {String} `singular` Singular name of the collection.
   * @api public
   */

  app.asyncHelper(single, function viewHelper(name, locals, options, cb) {
    app.emit('helper', single + ' helper > rendering "' + name + '"');
    debug('"%s" searching for "%s"', single, name);

    if (typeof locals === 'function') {
      return viewHelper.call(this, name, {}, {}, locals);
    }

    if (typeof options === 'function') {
      return viewHelper.call(this, name, locals, {}, options);
    }

    options = options || {};
    locals = locals || {};

    var opts = helperOptions.call(this, locals, options);
    var views = app[plural];

    var view = views.getView(name, opts);
    if (!view) {
      return utils.helperError(app, single, name, cb);
    }

    var ctx = helperContext.call(this, view, locals, opts);
    debug('"%s" pre-rendering "%s"', single, name);

    app.render(view, ctx, function(err, res) {
      if (err) return cb(err);

      debug('"%s" post-rendering "%s"', single, name);
      cb(null, res.content);
    });
  });
};

/**
 * Create an options object from:
 *
 * - helper `locals`
 * - helper `options`
 * - options `hash` if it's registered as a handlebars helper
 * - context options (`this.options`), created from options define on `app.option()`.
 *
 * @param {Object} `locals`
 * @param {Object} `options`
 * @return {Object}
 */

function helperOptions(locals, options) {
  var hash = options.hash || locals.hash || {};
  var opts = utils.extend({}, this.options, hash);
  opts.hash = hash;
  return opts;
}

/**
 * Create the context to use for rendering from:
 *
 * - helper `locals`
 * - helper `options`
 * - context (`this.context`)
 * - `options.hash` if it's registered as a handlebars helper
 * - `view.locals`: locals defined on the view being rendered
 * - `view.data`: data from front-matter
 *
 * @param {Object} `view` the view being rendered
 * @param {Object} `locals` Helper locals
 * @param {Object} `options` Helper options
 * @return {Object}
 */

function helperContext(view, locals, options) {
  var fn = this.options.helperContext;
  var extend = utils.extend;
  var context = {};

  if (typeof fn === 'function') {
    context = fn.call(this, view, locals, options);
  } else {
    // helper context
    context = extend({}, this.context.view.data);
    context = extend({}, context, this.context);

    // view context
    context = extend({}, context, view.locals, view.data);

    // helper locals and options
    context = extend({}, context, locals, options.hash);
  }
  return context;
}
