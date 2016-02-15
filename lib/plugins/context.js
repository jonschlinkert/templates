'use strict';

var async = require('async');
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

  if (!this.options.hasOwnProperty('namespace')) {
    this.options.namespace = true;
  }

  /**
   * Load the `base-data` plugin
   */

  app.use(utils.baseData(this.options));

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
    if (typeof this.options.mergeContext === 'function') {
      return this.options.mergeContext.apply(this, arguments);
    }
    var obj = {};
    obj = utils.merge({}, obj, this.cache.data);
    obj = utils.merge({}, obj, view.locals);
    obj = utils.merge({}, obj, view.data);
    obj = utils.merge({}, obj, locals);
    return obj;
  });

  /**
   * Bind context to helpers.
   */

  app.define('bindHelpers', function(view, locals, context, isAsync) {
    var helpers = {};
    var obj = this._.helpers;
    utils.extend(helpers, this.options.helpers);
    utils.extend(helpers, obj.sync);
    if (isAsync) utils.extend(helpers, obj.async);

    utils.extend(helpers, locals.helpers);

    var options = {};
    // support helper options: `app.option('helper.foo', 'bar')`
    if (this.options.hasOwnProperty('helper')) {
      var opts = this.options.helper;
      for (var key in opts) {
        if (opts.hasOwnProperty(key) && helpers.hasOwnProperty(key)) {
          options[key] = opts[key];
        }
      }
    }

    // build the context to expose as `this` in helpers
    var thisArg = {};
    thisArg.options = utils.extend({}, this.options, options, locals);
    thisArg.context = context;
    thisArg.context.view = view;
    thisArg.app = this;

    // bind template helpers to the instance
    locals.helpers = utils.bindAll(helpers, thisArg);
    view.isBound = true;
  });

  /**
   * Merge "partials" view types. This is necessary for template
   * engines have no support for partials or only support one
   * type of partials.
   *
   * @name .mergePartialsSync
   * @param {Object} `options` Optionally pass an array of `viewTypes` to include on `options.viewTypes`
   * @return {Object} Merged partials
   * @api public
   */

  app.define('mergePartialsSync', function(options) {
    var opts = utils.extend({}, this.options, options);
    var names = opts.mergeTypes || this.viewTypes.partial;
    var partials = {};
    var self = this;

    names.forEach(function(name) {
      var collection = self.views[name];
      for (var key in collection) {
        var view = collection[key];

        // handle `onMerge` middleware
        self.handleView('onMerge', view);

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
  });

  /**
   * Merge "partials" view types. This is necessary for template engines
   * have no support for partials or only support one type of partials.
   *
   * @name .mergePartials
   * @param {Object} `options` Optionally pass an array of `viewTypes` to include on `options.viewTypes`
   * @param {Function} `callback` Function that exposes `err` and `partials` parameters
   * @api public
   */

  app.define('mergePartials', function(options, done) {
    if (typeof options === 'function') {
      done = options;
      options = {};
    }

    var opts = utils.extend({}, this.options, options);
    var names = opts.mergeTypes || this.viewTypes.partial;
    var partials = {};
    var self = this;

    async.reduce(names, partials, function(acc, name, cb) {
      var collection = self.views[name];

      async.eachOf(collection, function(view, key, next) {
        // handle `onMerge` middleware
        self.handle('onMerge', view, function(err, file) {
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
  });
};
