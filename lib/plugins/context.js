'use strict';

var async = require('async');
var debug = require('debug');
var utils = require('../utils');

/**
 * Plugin for adding data and context related methods to
 * an instance of `app` or `collection`.
 */

module.exports = function(app) {

  /**
   * Set, get and load data to be passed to templates as
   * context at render-time.
   *
   * ```js
   * app.data('a', 'b');
   * app.data({c: 'd'});
   * console.log(app.cache.data);
   * //=> {a: 'b', c: 'd'}
   * ```
   *
   * @name .data
   * @param {String|Object} `key` Pass a key-value pair or an object to set.
   * @param {any} `val` Any value when a key-value pair is passed. This can also be options if a glob pattern is passed as the first value.
   * @return {Object} Returns an instance of `Templates` for chaining.
   * @api public
   */

  if (!app.options.hasOwnProperty('namespace')) {
    app.options.namespace = true;
  }

  /**
   * Load the `base-data` plugin
   */

  app.use(utils.baseData(app.options));

  /**
   * Register a default data loader
   */

  app.dataLoader('json', function(str) {
    return JSON.parse(str);
  });

  /**
   * Build the context for the given `view` and `locals`.
   *
   * @name .context
   * @param  {Object} `view` The view being rendered
   * @param  {Object} `locals`
   * @return {Object} The object to be passed to engines/views as context.
   * @api public
   */

  app.define('context', function(view, locals) {
    // backwards support for `mergeContext`
    var fn = this.options.context || this.options.mergeContext;
    if (typeof fn === 'function') {
      return fn.apply(this, arguments);
    }
    return utils.merge({}, this.cache.data, view.context(locals));
  });

  /**
   * Bind context to helpers.
   */

  app.define('bindHelpers', function(view, locals, context, isAsync) {
    var cached = this._.helpers;

    // merge cached _synchronous_ helpers with helpers defined on `app.options`
    var helpers = utils.extend({}, this.options.helpers, cached.sync);

    // add helpers defined on the context
    helpers = utils.extend({}, helpers, context.helpers);

    // if any _async_ helpers are defined, merge those onto the context LAST
    if (isAsync) {
      helpers = utils.extend({}, helpers, cached.async);
    }

    // create the context to expose as `this` inside helper functions
    var thisArg = new Context(this, view, locals, context, helpers);

    // bind the context to helpers.
    context.helpers = utils.bindAll(helpers, thisArg, {
      bindFn: function(thisArg, key, options) {
        var namespace = thisArg.app._namespace || 'base:templates';
        thisArg.debug = debug(namespace + ':helper:' + key);
        setHelperOptions(thisArg, key);
        thisArg.helper.name = key;
        return thisArg;
      }
    });
  });

  /**
   * Update context in a helper so that `this.helper.options` is
   * the options for that specific helper.
   *
   * @param {Object} `context`
   * @param {String} `key`
   * @api public
   */

  function setHelperOptions(context, key) {
    var optsHelper = context.options.helper || {};
    if (optsHelper.hasOwnProperty(key)) {
      context.helper.options = optsHelper[key];
    }
  }

  /**
   * Create a new context object to expose inside helpers.
   *
   * ```js
   * app.helper('lowercase', function(str) {
   *   // the 'this' object is the _helper_ context
   *   console.log(this);
   *   // 'this.app' => the application instance, e.g. templates, assemble, verb etc.
   *   // 'this.view' => the current view being rendered
   *   // 'this.helper' => helper name and options
   *   // 'this.context' => template context (as opposed to _helper_ context)
   *   // 'this.options' => merged options from app, view, and helper options
   * });
   * ```
   * @param {Object} `app`
   * @param {Object} `view`
   * @param {Object} `context`
   * @param {Object} `options`
   */

  function Context(app, view, locals, context, helpers) {
    this.helper = {};
    this.helper.options = createHelperOptions(app, view, helpers);

    this.options = utils.merge({}, app.options, view.options, this.helper.options);
    this.context = context;

    utils.define(this.options, 'handled', this.options.handled);
    utils.define(this.context, 'view', view);

    decorate(this.context);
    decorate(this.options);
    decorate(this);

    this.view = view;
    this.app = app;
  }

  /**
   * Decorate the given object with `merge`, `set` and `get` methods
   */

  function decorate(obj) {
    utils.define(obj, 'merge', function() {
      var args = [].concat.apply([], [].slice.call(arguments));
      var len = args.length;
      var idx = -1;

      while (++idx < len) {
        var val = args[idx];
        if (!utils.isObject(val)) continue;
        if (val.hasOwnProperty('hash')) {
          // shallow clone and delete the `data` object
          val = utils.merge({}, val, val.hash);
          delete val.data;
        }
        utils.merge(obj, val);
      }
      // ensure methods aren't overwritten
      decorate(obj);
      if (obj.hasOwnProperty('app') && obj.hasOwnProperty('options')) {
        decorate(obj.options);
      }
      return obj;
    });

    utils.define(obj, 'get', function(prop) {
      return utils.get(obj, prop);
    });

    utils.define(obj, 'set', function(key, val) {
      return utils.set(obj, key, val);
    });
  }

  /**
   * Support helper options defined on `app.options.helper`. For example,
   * to define options for helper `foo`:
   *
   * ```js
   * app.option('helper.foo', {doStuff: true});
   * ```
   * @param {Object} `app`
   * @param {Object} `helpers` Currently defined helpers, to match up options
   * @return {Object} Returns helper options
   */

  function createHelperOptions(app, view, helpers) {
    var options = utils.merge({}, app.options, view.options);
    var helperOptions = {};

    if (options.hasOwnProperty('helper')) {
      var opts = options.helper;
      if (!utils.isObject(opts)) return helperOptions;

      for (var key in opts) {
        if (opts.hasOwnProperty(key) && helpers.hasOwnProperty(key)) {
          helperOptions[key] = opts[key];
        }
      }
    }
    return helperOptions;
  }

  /**
   * Merge "partials" view types. This is necessary for template
   * engines have no support for partials or only support one
   * type of partials.
   *
   * @name .mergePartials
   * @param {Object} `options` Optionally pass an array of `viewTypes` to include on `options.viewTypes`
   * @return {Object} Merged partials
   * @api public
   */

  app.define('mergePartials', mergePartials);

  function mergePartials(options) {
    var opts = utils.merge({}, this.options, options);
    var names = opts.mergeTypes || this.viewTypes.partial;
    var partials = {};
    var self = this;

    names.forEach(function(name) {
      var collection = self.views[name];
      for (var key in collection) {
        var view = collection[key];

        // handle `onMerge` middleware
        self.handleOnce('onMerge', view);

        if (view.options.nomerge) continue;
        if (opts.mergePartials !== false) {
          name = 'partials';
        }

        // convert the partial to:
        //=> {'foo.hbs': 'some content...'};
        partials[name] = partials[name] || {};
        partials[name][key] = view.content;
      }
    });
    return partials;
  };

  /**
   * Merge "partials" view types. This is necessary for template engines
   * have no support for partials or only support one type of partials.
   *
   * @name .mergePartialsAsync
   * @param {Object} `options` Optionally pass an array of `viewTypes` to include on `options.viewTypes`
   * @param {Function} `callback` Function that exposes `err` and `partials` parameters
   * @api public
   */

  mergePartials.async = function(options, done) {
    if (typeof options === 'function') {
      done = options;
      options = {};
    }

    var opts = utils.merge({}, this.options, options);
    var names = opts.mergeTypes || this.viewTypes.partial;
    var partials = {};
    var self = this;

    async.reduce(names, partials, function(acc, name, cb) {
      var collection = self.views[name];

      async.eachOf(collection, function(view, key, next) {
        // handle `onMerge` middleware
        self.handleOnce('onMerge', view, function(err, file) {
          if (err) return next(err);

          if (file.options.nomerge) {
            return next();
          }

          if (opts.mergePartials !== false) {
            name = 'partials';
          }

          // convert the partial to:
          //=> {'foo.hbs': 'some content...'};
          acc[name] = acc[name] || {};
          acc[name][key] = file.content;
          next(null, acc);
        });
      }, function(err) {
        if (err) return cb(err);
        cb(null, partials);
      });
    }, done);
  }.bind(app);

  app.define('mergePartialsAsync', mergePartials.async);
};
