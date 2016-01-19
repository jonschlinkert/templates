'use strict';

var List = require('./list');
var utils = require('./utils');

module.exports = function(app, options) {
  // if `options` is an instance of `view`, get `view.options`
  if (options.hasOwnProperty('options')) {
    options = options.options;
  }

  // get inflections
  var single = options.inflection;
  var plural = options.plural;
  var collection = app[plural];

  /**
   * Get a specific view by `name`, optionally specifying
   * the collection to search as the second argument.
   *
   * @param {String} `name`
   * @param {String} `collection`
   * @return {String}
   * @api public
   */

  app.helper('view', function(name, collectionName) {
    var last = utils.last(arguments);
    if (utils.isOptions(last)) {
      var args = [].slice.call(arguments, 1);
      args.pop(); // drop hbs options object
      collectionName = args.pop();
    }
    var view = app.find(name, collectionName);
    return view && view.content || '';
  });

  /**
   * Create async helpers for each default template `type`.
   *
   * @param {String} `type` The type of template.
   * @param {String} `plural` Plural form of `type`.
   */

  app.asyncHelper(single, viewHelper);

  /**
   * Create sync helpers for each view collection
   *
   * @param {String} `plural` Pluralized name of the collection.
   */

  app.asyncHelper(plural, function listHelper(context, cb) {
    if (typeof context === 'string') {
      return viewHelper.apply(this, arguments);
    }

    var ctx = new List(collection);
    // render block helper with list as context
    if (typeof context.fn === 'function') {
      return cb(null, context.fn(ctx));
    }

    // return list when not used as a block helper
    cb(null, ctx);
  });

  /**
   * Create sync helpers for each view collection
   *
   * @param {String} `plural` Pluralized name of the collection.
   */

  function viewHelper(name, locals, options, cb) {
    app.emit('helper', single + ' helper > rendering "' + name + '"');

    if (typeof locals === 'function') {
      return viewHelper.call(this, name, {}, {}, locals);
    }

    if (typeof options === 'function') {
      return viewHelper.call(this, name, locals, {}, options);
    }

    options = options || {};
    locals = locals || {};

    var opts = helperOptions.call(this, locals, options);
    var view = collection.getView(name, opts);
    if (!view) {
      return utils.helperError(app, single, name, cb);
    }

    var ctx = helperContext.call(this, view, locals, opts);

    this.app.render(view, ctx, function(err, res) {
      if (err) return cb(err);
      cb(null, res.content);
    });
  }
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
