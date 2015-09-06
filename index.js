/*!
 * templates <https://github.com/jonschlinkert/templates>
 *
 * Copyright (c) 2015, Jon Schlinkert.
 * Licensed under the MIT License.
 */

'use strict';

var Base = require('base-methods');
var router = require('en-route');
var extend = require('extend-shallow');
var define = require('define-property');
var delegate = require('delegate-properties');
var layouts = require('layouts');
var utils = require('./lib/utils')(require);
var Views = require('./lib/views');
var View = require('./lib/view');

function Templates(options) {
  if (!(this instanceof Templates)) {
    return new Templates(options);
  }
  Base.call(this);
  this.options = options || {};
  this.define('Views', this.options.Views || Views);
  this.define('View', this.options.View || View);
  delete this.options.Views;
  delete this.options.View;
  this.views = {};
}

Base.extend(Templates);

/**
 * `Templates` prototype methods
 */

delegate(Templates.prototype, {
  constructor: Templates,

  create: function(name, options) {
    var views = !(options instanceof this.Views)
      ? new this.Views(options)
      : options;

    define(this, name, views.addView);
    define(this.views, name, views.views);

    for (var key in views) {
      define(this[name], key, views);
    }
    return this;
  },

  /**
   * Add `Router` to the prototype
   */

  Router: router.Router,

  /**
   * Lazily initalize `router`, to allow options to
   * be passed in after init.
   */

  lazyRouter: function() {
    if (typeof this.router === 'undefined') {
      this.define('router', new this.Router({
        methods: utils.methods
      }));
    }
  },

  /**
   * Handle middleware for the given `view` and locals.
   *
   * ```js
   * app.handle('customHandle', view);
   * ```
   *
   * @name .handle
   * @param {String} `method` Router VERB
   * @param {Object} `view` View object
   * @param {Object} `locals`
   * @param {Function} `cb`
   * @return {Object}
   * @api public
   */

  handle: function (method, view, locals, cb) {
    if (typeof locals === 'function') {
      cb = locals;
      locals = {};
    }

    this.lazyRouter();
    view.options = view.options || {};
    view.options.handled = view.options.handled || [];

    if (typeof cb !== 'function') {
      cb = this.handleError(method, view);
    }

    view.options.method = method;
    view.options.handled.push(method);
    if (view.emit) {
      view.emit('handle', method);
    }

    this.router.handle(view, function (err) {
      if (err) return cb(err);
      cb(null, view);
    });
  },

  /**
   * Run the given middleware handler only if the view has not
   * already been handled by the method.
   *
   * @name .handleView
   * @param  {Object} `method`
   * @param  {Object} `view`
   * @param  {Object} `locals`
   */

  handleView: function (method, view, locals/*, cb*/) {
    if (view.options.handled.indexOf(method) === -1) {
      this.handle.apply(this, arguments);
    }
    this.emit(method, view, locals);
  },

  /**
   * Handle middleware errors.
   */

  handleError: function(method, view) {
    return function (err) {
      if (err) {
        err.reason = 'Templates#handle' + method + ': ' + view.path;
        return err;
      }
    };
  },

  /**
   * Special-cased "all" method, applying the given route `path`,
   * middleware, and callback.
   *
   * @name .all
   * @param {String} `path`
   * @param {Function} `callback`
   * @return {Object} `this` for chaining
   */

  all: function(path/*, callback*/) {
    this.lazyRouter();
    var route = this.router.route(path);
    route.all.apply(route, [].slice.call(arguments, 1));
    return this;
  },

  /**
   * Proxy to `Router#param`
   *
   * @name .param
   * @param {String} `name`
   * @param {Function} `fn`
   * @return {Object} Returns the instance of `Templates` for chaining.
   */

  param: function(/*name, fn*/) {
    this.lazyRouter();
    this.router.param.apply(this.router, arguments);
    return this;
  },

  /**
   * Apply a layout to the given `view`.
   *
   * @name .applyLayout
   * @param  {Object} `view`
   * @return {Object} Returns a `view` object.
   */

  applyLayout: function(view) {
    if (view.options.layoutApplied) {
      return view;
    }

    // handle pre-layout middleware
    this.handle('preLayout', view);

    // get the layout stack
    var stack = {};
    var alias = this.viewTypes.layout;
    var len = alias.length, i = 0;

    while (len--) {
      var views = this.views[alias[i++]];
      for (var key in views) {
        var val = views[key];
        if (views.hasOwnProperty(key) && typeof val !== 'function' && val.path) {
          stack[key] = val;
        }
      }
    }

    // get the name of the first layout
    var name = view.layout;
    var str = view.content;
    var self = this;

    // Handle each layout before it's applied to a view
    function handleLayout(layoutObj) {
      view.currentLayout = layoutObj.layout;
      self.handle('onLayout', view);
      delete view.currentLayout;
    }

    var opts = {};
    extend(opts, this.options);
    extend(opts, view.options);
    extend(opts, view.context());

    // actually apply the layout
    var res = layouts(str, name, stack, opts, handleLayout);

    view.option('layoutStack', res.history);
    view.option('layoutApplied', true);
    view.content = res.result;

    // handle post-layout middleware
    this.handle('postLayout', view);
    return view;
  },


  /**
   * Merge "partials" view types. This is necessary for template
   * engines that only support one class of partials.
   *
   * @name .mergePartials
   * @param {Object} `locals`
   * @param {Array} `viewTypes` Optionally pass an array of viewTypes to include.
   * @return {Object} Merged partials
   */

  mergePartials: function (locals, viewTypes) {
    var names = viewTypes || this.viewTypes.partial;
    var opts = utils.extend({}, this.options, locals);

    return names.reduce(function (acc, name) {
      var collection = this.views[name];

      utils.forOwn(collection, function (view, key) {
        // handle `onMerge` middleware
        this.handleView('onMerge', view, locals);

        if (view.options.nomerge) return;
        if (opts.mergePartials !== false) {
          name = 'partials';
        }
        acc[name] = acc[name] || {};
        acc[name][key] = view.content;
      }, this);
      return acc;
    }.bind(this), {});
  },

  /**
   * Build the context for the given `view` and `locals`.
   *
   * @name .context
   * @param  {Object} `view` Template object
   * @param  {Object} `locals`
   * @return {Object} The object to be passed to engines/views as context.
   */

  context: function (view, ctx, locals) {
    var obj = {};
    utils.mixin(obj, ctx);
    utils.mixin(obj, this.cache.data);
    utils.mixin(obj, view.data);
    utils.mixin(obj, view.locals);
    utils.mixin(obj, locals);
    return obj;
  },

  /**
   * Bind context to helpers.
   */

  bindHelpers: function (view, locals, context, isAsync) {
    var helpers = {};
    utils.extend(helpers, this.options.helpers);
    utils.extend(helpers, this._.helpers.sync);

    if (isAsync) utils.extend(helpers, this._.helpers.async);
    utils.extend(helpers, locals.helpers);

    // build the context to expose as `this` in helpers
    var thisArg = {};
    thisArg.options = utils.extend({}, this.options, locals);
    thisArg.context = context || {};
    thisArg.context.view = view;
    thisArg.app = this;

    // bind template helpers to the instance
    locals.helpers = utils.bindAll(helpers, thisArg);
  },

  /**
   * Add a router handler.
   *
   * @param  {String} `method` Method name.
   */

  handler: function (methods) {
    this.handlers(methods);
  },

  /**
   * Add default Router handlers to Template.
   */

  handlers: function (methods) {
    this.lazyRouter();
    this.router.method(methods);
    utils.arrayify(methods).forEach(function (method) {
      this.define(method, function(path) {
        var route = this.router.route(path);
        var args = [].slice.call(arguments, 1);
        route[method].apply(route, args);
        return this;
      }.bind(this));
    }.bind(this));
  },

  /**
   * Format an error
   */

  error: function(method, id, msg) {
    return new Error(this.errors[method][id] + 'Template#' + method + ' ' + msg);
  }
});

/**
 * Expose `Templates`
 */

module.exports = Templates;

// var app = new Templates();

// app.create('pages');

// app.pages('a', {content: '...'});
// app.pages('b', {content: '...'});

// console.log(app.views)
