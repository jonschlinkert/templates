'use strict';

var List = require('../list');
var utils = require('../utils');

module.exports = function(app, options) {
  // if `options` is an instance of `view`, get `view.options`
  if (options.hasOwnProperty('options')) {
    options = options.options;
  }

  var viewType = options.viewType;
  var single = options.inflection;
  var plural = options.plural;
  var merge = utils.extend;

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

  app.helper('view', function(name, type) {
    var last = utils.last(arguments);
    if (utils.isOptions(last)) {
      var args = [].slice.call(arguments, 1);
      args.pop(); // drop hbs options object
      type = args.pop();
    }
    var view = app.find(name, type);
    return view && view.content || '';
  });

  /**
   * Create async helpers for each default template `type`.
   *
   * @param {String} `type` The type of template.
   * @param {String} `plural` Plural form of `type`.
   */

  if (viewType.indexOf('partial') > -1) {
    app.asyncHelper(single, createdHelper);
  }

  /**
   * Create sync helpers for each view collection
   *
   * @param {String} `plural` Pluralized name of the collection.
   * @api private
   */

  app.asyncHelper(options.plural, function listHelper(context, cb) {
    if (typeof context.fn !== 'function') {
      createdHelper.apply(this, arguments);
      return;
    }
    var ctx = new List(collection);
    cb(null, context.fn(ctx));
  });

  /**
   * Create sync helpers for each view collection
   *
   * @param {String} `plural` Pluralized name of the collection.
   * @api private
   */

  function createdHelper(name, locals, options, cb) {
    var args = [].slice.call(arguments, 1);
    cb = args.pop();

    var opts = utils.extend({}, this.options, locals);
    if (options && options.hash) {
      opts = utils.extend({}, opts, options.hash);
    }

    var view = collection.getView(name, opts);
    if (app.enabled('verbose')) {
      console.log(single, 'helper, rendering:', name);
    }

    if (!view) {
      app.emit('error', new Error('helper "' + single + '" cannot find "' + name + '"'));
      return cb(null, '');
    }
    var ctx = {};


    merge(ctx, this.context.view.data);
    merge(ctx, this.context);
    merge(ctx, view.locals);
    merge(ctx, view.data);
    merge(ctx, locals);

    return this.app.render(view, ctx, function(err, res) {
      if (err) return cb(err);
      cb(null, res.content);
    });
  }
};
