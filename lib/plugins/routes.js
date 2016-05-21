'use strict';

var debug = require('debug')('base:templates:routes');
var utils = require('../utils');

module.exports = function(proto) {
  debug('loading routes methods onto %s, <%s>', proto.constructor.name);

  /**
   * Add `Router` and `Route` to the prototype
   */

  proto.Router = utils.router.Router;
  proto.Route = utils.router.Route;

  /**
   * Lazily initalize `router`, to allow options to
   * be passed in after init.
   */

  proto.lazyRouter = function(methods) {
    if (typeof this.router === 'undefined') {
      this.define('router', new this.Router({
        methods: utils.methods
      }));
    }

    if (typeof methods !== 'undefined') {
      this.router.method(methods);
    }
  };

  /**
   * Handle a middleware `method` for `view`.
   *
   * ```js
   * app.handle('customMethod', view, callback);
   * ```
   * @name .handle
   * @param {String} `method` Name of the router method to handle. See [router methods](./docs/router.md)
   * @param {Object} `view` View object
   * @param {Function} `callback` Callback function
   * @return {Object}
   * @api public
   */

  proto.handle = function(method, view, locals, next) {
    debug('handling "%s" middleware for %s "%s"', method, view.options.inflection, view.basename);

    if (typeof locals === 'function') {
      next = locals;
      locals = {};
    }

    this.lazyRouter();
    if (!view.options.handled) {
      view.options.handled = [];
    }

    var cb = this.handleError(method, view, next);
    view.options.method = method;
    view.options.handled.push(method);
    this.emit(method, view);

    // if inside a collection or the collection is not specified on view.options
    // just handle the route and return
    if (!this.isTemplates || this.isCollection || !view.options.collection) {
      this.router.handle(view, cb);
      return;
    }

    // handle the app routes first, then handle the collection routes
    var collection = this[view.options.collection];

    this.router.handle(view, function(err) {
      if (err) return cb(err);
      collection.handle(method, view, cb);
    });
  };

  /**
   * Run the given middleware handler only if the view has not
   * already been handled by the method.
   *
   * @name .handleOnce
   * @param  {Object} `method`
   * @param  {Object} `view`
   * @param  {Object} `locals`
   */

  proto.handleOnce = function(method, view, cb) {
    if (!view.options.handled) {
      view.options.handled = [];
    }

    if (view.options.handled.indexOf(method) === -1) {
      this.handle(method, view, cb);
      return;
    }

    if (typeof cb === 'function') {
      cb(null, view);
    }
  };

  /**
   * Deprecated, use `.handleOnce`
   *
   * @api public
   */

  proto.handleView = function() {
    console.warn('.handleView is deprecated, use .handleOnce instead.');
    return this.handleOnce.apply(this, arguments);
  };

  /**
   * Handle middleware errors.
   */

  proto.handleError = function(method, view, next) {
    var app = this;

    if (typeof next !== 'function') {
      next = utils.identity;
    }

    return function(err) {
      if (err) {
        err.source = err.stack.split('\n')[1].trim();
        err.reason = app._name + '#handle("' + method + '"): ' + view.path;

        if (app.hasListeners('error')) {
          app.emit('error', err);
        }

        if (typeof next !== 'function') throw err;
        next(err);
        return;
      }

      if (typeof next !== 'function') {
        throw new TypeError('expected a callback function');
      }
      next(null, view);
    };
  };

  /**
   * Create a new Route for the given path. Each route contains
   * a separate middleware stack.
   *
   * See the [route API documentation][route-api] for details on
   * adding handlers and middleware to routes.
   *
   * ```js
   * app.create('posts');
   * app.route(/blog/)
   *   .all(function(view, next) {
   *     // do something with view
   *     next();
   *   });
   *
   * app.post('whatever', {path: 'blog/foo.bar', content: 'bar baz'});
   * ```
   * @name .route
   * @param {String} `path`
   * @return {Object} `Route` for chaining
   * @api public
   */

  proto.route = function(/*path*/) {
    this.lazyRouter();
    return this.router.route.apply(this.router, arguments);
  };

  /**
   * Special route method that works just like the `router.METHOD()`
   * methods, except that it matches all verbs.
   *
   * ```js
   * app.all(/\.hbs$/, function(view, next) {
   *   // do stuff to view
   *   next();
   * });
   * ```
   * @name .all
   * @param {String} `path`
   * @param {Function} `callback`
   * @return {Object} `this` for chaining
   * @api public
   */

  proto.all = function(path/*, callback*/) {
    this.lazyRouter();
    var route = this.route(path);
    route.all.apply(route, [].slice.call(arguments, 1));
    return this;
  };

  /**
   * Add callback triggers to route parameters, where
   * `name` is the name of the parameter and `fn` is the
   * callback function.
   *
   * ```js
   * app.param('title', function(view, next, title) {
   *   //=> title === 'foo.js'
   *   next();
   * });
   *
   * app.onLoad('/blog/:title', function(view, next) {
   *   //=> view.path === '/blog/foo.js'
   *   next();
   * });
   * ```
   * @name .param
   * @param {String} `name`
   * @param {Function} `fn`
   * @return {Object} Returns the instance of `Templates` for chaining.
   * @api public
   */

  proto.param = function(/*name, fn*/) {
    this.lazyRouter();
    this.router.param.apply(this.router, arguments);
    return this;
  };

  /**
   * Add a router handler.
   *
   * @param  {String} `method` Method name.
   */

  proto.handler = function(methods) {
    this.handlers(methods);
    return this;
  };

  /**
   * Add default Router handlers to Templates.
   */

  proto.handlers = function(methods) {
    this.lazyRouter(methods);
    mixinHandlers(methods);
    return this;
  };

  // Mix router handler methods onto the instance
  mixinHandlers(utils.methods);
  function mixinHandlers(methods) {
    utils.arrayify(methods).forEach(function(method) {
      utils.define(proto, method, function(path) {
        var route = this.route(path);
        var args = [].slice.call(arguments, 1);
        route[method].apply(route, args);
        return this;
      });
    });
  }
};

