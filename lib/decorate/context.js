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
      helpers[key] = utils.bindAll(obj[key], thisArg);
    });

    // bind template helpers to the instance
    locals.helpers = utils.bindAll(helpers, thisArg);
    context.isBound = true;
  };
};
