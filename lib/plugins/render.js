'use strict';

var context = require('./context');
var utils = require('../utils');

module.exports = function (proto) {

  /**
   * Set view types for a collection.
   *
   * @param {String} `plural` e.g. `pages`
   * @param {Object} `options`
   */

  proto.viewType = proto.viewType || function(plural, types) {
    var len = types.length, i = 0;
    while (len--) {
      var type = types[i++];
      this.viewTypes[type] = this.viewTypes[type] || [];
      if (this.viewTypes[type].indexOf(plural) === -1) {
        this.viewTypes[type].push(plural);
      }
    }
    return types;
  };

  /**
   * Compile `content` with the given `locals`.
   *
   * ```js
   * var indexPage = app.page('some-index-page.hbs');
   * var view = app.compile(indexPage);
   * // view.fn => [function]
   *
   * // you can call the compiled function more than once
   * // to render the view with different data
   * view.fn({title: 'Foo'});
   * view.fn({title: 'Bar'});
   * view.fn({title: 'Baz'});
   * ```
   *
   * @name .compile
   * @param  {Object|String} `view` View object.
   * @param  {Object} `locals`
   * @param  {Boolean} `isAsync` Load async helpers
   * @return {Object} View object with `fn` property with the compiled function.
   * @api public
   */

  proto.compile = function(view, locals, isAsync) {
    if (typeof locals === 'boolean') {
      isAsync = locals;
      locals = {};
    }

    if (typeof locals === 'function' || typeof isAsync === 'function') {
      throw this.error('compile', 'callback');
    }

    locals = utils.extend({settings: {}}, locals);

    // if `view` is a string, see if it's a cached view
    if (typeof view === 'string') {
      if (this.isCollection) {
        view = this.getView(view);

      } else if (this.isList) {
        view = this.getItem(view);

      } else {
        view = this.find(view);
      }
    }

    // handle `preCompile` middleware
    this.handleView('preCompile', view);

    // get the engine to use
    var ext = utils.resolveEngine(view, locals, this.options);
    var engine = this.getEngine(ext);

    if (typeof engine === 'undefined') {
      throw this.error('compile', 'engine', ext || 'undefined');
    }

    if (engine && engine.options) {
      locals.settings = utils.merge({}, locals.settings, engine.options);
    }

    var ctx = view.context(locals);

    // apply layout
    view = this.applyLayout(view);

    // Bind context to helpers before passing to the engine.
    this.bindHelpers(view, locals, ctx, (locals.async = isAsync));

    // shallow clone the context and locals
    var settings = utils.extend({}, ctx, locals);
    utils.extend(settings, this.mergePartials(settings));

    // compile the string
    view.fn = engine.compile(view.content, settings);

    // handle `postCompile` middleware
    this.handleView('postCompile', view);
    return view;
  };

  /**
   * Render a view with the given `locals` and `callback`.
   *
   * ```js
   * var blogPost = app.post.getView('2015-09-01-foo-bar');
   * app.render(blogPost, {title: 'Foo'}, function(err, view) {
   *   // `view` is an object with a rendered `content` property
   * });
   * ```
   * @name .render
   * @param  {Object|String} `view` Instance of `View`
   * @param  {Object} `locals` Locals to pass to template engine.
   * @param  {Function} `callback`
   * @api public
   */

  proto.render = function (view, locals, cb) {
    if (typeof locals === 'function') {
      cb = locals;
      locals = {};
    }

    if (typeof cb !== 'function') {
      throw this.error('render', 'callback');
    }

    // if `view` is a string, see if it's a cached view
    if (typeof view === 'string') {
      if (this.isCollection) {
        view = this.getView(view);

      } else if (this.isList) {
        view = this.getItem(view);

      } else {
        view = this.find(view);
      }
    }

    view.locals = utils.merge({}, view.locals, locals);
    view.locals = utils.merge({}, this.cache.data, view.locals);
    var opts = this.options;

    // handle `preRender` middleware
    this.handleView('preRender', view);

    // get the engine
    var ext = utils.resolveEngine(view, locals, opts);
    var engine = this.getEngine(ext);

    if (!engine) {
      return cb(this.error('render', 'engine', ext));
    }

    var isAsync = typeof cb === 'function';

    // if it's not already compiled, do that first
    if (typeof view.fn !== 'function') {
      try {
        view = this.compile(view, locals, isAsync);
        return this.render(view, locals, cb);
      } catch(err) {
        this.emit('error', err);
        return cb.call(this, err);
      }
    }

    var ctx = utils.merge({}, view.locals, locals);
    var context = this.context(view, ctx, locals);

    // render the view
    return engine.render(view.fn, context, function (err, res) {
      if (err) {
        // rethrow is a noop if `options.rethrow` is not true
        err = this.rethrow('render', err, view, context);
        this.emit('error', err);
        return cb.call(this, err);
      }

      view.contents = res;
      // handle `postRender` middleware
      this.handle('postRender', view, locals, cb);
    }.bind(this));
  };
};
