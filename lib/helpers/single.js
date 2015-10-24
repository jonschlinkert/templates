'use strict';

var utils = require('../utils');

module.exports = function (app, collection, options) {
  // if `options` is an instance of `view`, get `view.options`
  if (options.hasOwnProperty('options')) {
    options = options.options;
  }

  var merge = utils.extend;
  var single = options.inflection;
  var viewType = options.viewType;

  /**
   * Get a specific view by `name`, optionally specifying
   * the collection to search as the second argument.
   *
   * @param {String} `name`
   * @param {String} `collection`
   * @return {String}
   * @api public
   */

  app.helper('view', function (name, type) {
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

  function createdHelper(name, locals, options, cb) {
    var args = [].slice.call(arguments, 1);
    cb = args.pop();

    try {
      var view = collection.views[name] || collection.getView(name);
      switch(args.length) {
        case 2:
          options = args.pop();
          locals = args[0];
          break;
        case 1:
          options = {};
          locals = args[0];
          break;
        default:
          options = {};
          locals = {};
      }

      var ctx = {};
      merge(ctx, this.context.view.data);
      merge(ctx, this.context);
      merge(ctx, view.locals);
      merge(ctx, view.data);
      merge(ctx, locals);

      return this.app.render(view, ctx, function (err, res) {
        if (err) return cb(err);

        return cb(null, res.content);
      });

    } catch(err) {
      err.reason = 'error in helper: ' + single + ': ' + name;
      app.emit('error', err);
      return cb(null, '');
    }
  }
};
