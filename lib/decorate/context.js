'use strict';

var utils = require('../utils');

module.exports = function (proto) {

  /**
   * Build the context for the given `view` and `locals`.
   *
   * @name .context
   * @param  {Object} `view` Templates object
   * @param  {Object} `locals`
   * @return {Object} The object to be passed to engines/views as context.
   */

  proto.context = function (view, ctx, locals) {
    var obj = {};
    utils.extend(obj, ctx);
    utils.extend(obj, this.cache.data);
    utils.extend(obj, view.locals);
    utils.extend(obj, view.data);
    utils.extend(obj, locals);
    return obj;
  };

  /**
   * Bind context to helpers.
   */

  proto.bindHelpers = function (view, locals, context, isAsync) {
    if (context.isBound) return;

    var helpers = {};
    var obj = this._.helpers;
    utils.extend(helpers, this.options.helpers);
    utils.extend(helpers, obj.sync);
    if (isAsync) utils.extend(helpers, obj.async);

    var self = this;
    var types = Object.keys(obj).filter(function (key) {
      return key !== 'sync' && key !== 'async';
    });

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
    thisArg.context = context || {};
    thisArg.context.view = view;
    thisArg.app = this;

    types.forEach(function (key) {
      helpers[key] = obj[key];
    });

    // bind template helpers to the instance
    locals.helpers = utils.bindAll(helpers, thisArg);
    context.isBound = true;
  };

  /**
   * Merge "partials" view types. This is necessary for template
   * engines have no support for partials or only support one
   * type of partials.
   *
   * @name .mergePartials
   * @param {Object} `options` Optionally pass an array of viewTypes to include on `options.viewTypes`
   * @return {Object} Merged partials
   * @api public
   */

  proto.mergePartials = function (options) {
    var opts = utils.merge({}, this.options, options);
    var names = opts.mergeTypes || this.viewTypes.partial;
    var partials = {};
    var self = this;

    names.forEach(function (name) {
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
  };
};
