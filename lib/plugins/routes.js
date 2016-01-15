'use strict';

var utils = require('../utils');

module.exports = function(proto) {
  var define = require('define-property');

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

  proto.handle = function(method, view, locals, cb) {
    if (typeof locals === 'function') {
      cb = locals;
      locals = {};
    }

    this.lazyRouter();
    if (!view.options.handled) {
      view.options.handled = [];
    }

    if (typeof cb !== 'function') {
      cb = this.handleError(method, view);
    }

    view.options.method = method;
    view.options.handled.push(method);
    this.router.handle(view, this.handleError(method, view, cb));
    return this;
  };

  /**
   * Run the given middleware handler only if the view has not
   * already been handled by the method.
   *
   * @name .handleView
   * @param  {Object} `method`
   * @param  {Object} `view`
   * @param  {Object} `locals`
   */

  proto.handleView = function(method, view, cb) {
    if (!view.options.handled) {
      view.options.handled = [];
    }

    if (typeof cb !== 'function') {
      cb = function() {};
    }

    if (view.options.handled.indexOf(method) === -1) {
      this.handle(method, view, function(err) {
        if (err) {
          cb(err);
          return;
        }

        this.emit(method, view);
        cb(null, view);
      }.bind(this));
    }
    return this;
  };

  /**
   * Handle middleware errors.
   */

  proto.handleError = function(method, view, cb) {
    if (typeof cb !== 'function') cb = utils.identity;
    var app = this;
    return function(err) {
      if (err) {
        if (err._handled) return cb();
        define(err, '_handled', true);
        err.source = err.stack.split('\n')[1].trim();
        err.reason = app._name + '#handle("' + method + '"): ' + view.path;
        app.emit('error', err);
        return cb(err);
      }
      cb(null, view);
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
  };

  /**
   * Add default Router handlers to Templates.
   */

  proto.handlers = function(methods) {
    this.lazyRouter(methods);

    utils.arrayify(methods).forEach(function(method) {
      this.define(method, function(path) {
        var route = this.route(path);
        var args = [].slice.call(arguments, 1);
        route[method].apply(route, args);
        return this;
      }.bind(this));
    }.bind(this));
  };

  // Add router methods to Templates
  utils.methods.forEach(function(method) {
    proto[method] = function(path) {
      var route = this.route(path);
      var args = [].slice.call(arguments, 1);
      route[method].apply(route, args);
      return this;
    };
  });
};

