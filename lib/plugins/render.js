'use strict';

var utils = require('../utils');

module.exports = function(proto) {

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
   * Iterates over `renderable` view collections
   * and returns the first view that matches the
   * given `view` name
   */

  function findView(app, name) {
    var keys = app.viewTypes.renderable;
    var len = keys.length;
    var i = -1;

    var res = null;
    while (++i < len) {
      res = app.find(name, keys[i]);
      if (res) {
        break;
      }
    }
    return res;
  }

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
      throw this.formatError('compile', 'callback');
    }

    locals = utils.extend({settings: {}}, locals);

    // if `view` is a string, see if it's a cached view
    if (typeof view === 'string') {
      if (this.isCollection) {
        view = this.getView(view);

      } else if (this.isList) {
        view = this.getItem(view);

      } else {
        view = findView(this, view);
      }
    }

    // handle `preCompile` middleware
    this.handleView('preCompile', view);

    // determine the name of the engine to use
    var ext = utils.resolveEngine(view, locals, this.options);
    // get the actual engine (object)
    var engine = this.getEngine(ext);

    if (typeof engine === 'undefined') {
      throw this.formatError('compile', 'engine', formatExtError(view, ext));
    }

    engine.options.engineName = engine.options.name;
    delete engine.options.name;

    // get engine options (settings)
    var settings = utils.merge({}, locals.settings, engine.options);
    var ctx = view.context(locals);

    // apply layout
    view = this.applyLayout(view);

    // Bind context to helpers before passing to the engine.
    this.bindHelpers(view, locals, ctx, (locals.async = !!isAsync));

    // shallow clone the context and locals
    settings = utils.merge({}, ctx, locals, settings);
    settings = utils.merge({}, settings, this.mergePartials(settings));

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

  proto.render = function(view, locals, cb) {
    if (typeof locals === 'function') {
      cb = locals;
      locals = {};
    }

    if (typeof cb !== 'function') {
      throw this.formatError('render', 'callback');
    }

    // if `view` is a string, see if it's a cached view
    if (typeof view === 'string') {
      if (this.isCollection) {
        view = this.getView(view);

      } else if (this.isList) {
        view = this.getItem(view);

      } else {
        view = findView(this, view);
      }
    }

    // handle `preRender` middleware
    this.handleView('preRender', view, function(err) {
      if (err) return cb(err);

      // get the engine
      var ext = utils.resolveEngine(view, locals, this.options);
      var engine = this.getEngine(ext);

      if (!engine) {
        cb(this.formatError('render', 'engine', formatExtError(view, ext)));
        return;
      }

      var isAsync = typeof cb === 'function';

      // if it's not already compiled, do that first
      if (typeof view.fn !== 'function') {
        try {
          view = this.compile(view, locals, isAsync);
        } catch (err) {
          this.emit('error', err);
          cb(err);
          return;
        }
      }

      // build the context from the view's data, ctx object
      // created above, and locals passed to the render method
      var context = this.context(view, locals);

      // render the view
      engine.render(view.fn, context, function(err, res) {
        if (err) {
          // rethrow is a noop if `options.rethrow` is not true
          err = this.rethrow('render', err, view, context);
          this.emit('error', err);
          cb(err);
          return;
        }

        view.content = res;
        // handle `postRender` middleware
        this.handle('postRender', view, cb);
      }.bind(this));
    }.bind(this));
  };
};

function formatExtError(view, ext) {
  if (ext && typeof ext === 'string' && ext.trim()) {
    return ext;
  }
  return view.basename;
}
