'use strict';

var utils = require('../utils');

module.exports = function (app, collection, options) {
  var single = options.inflection;
  var merge = utils.merge;

  // if `options` is an instance of `view`, get `view.options`
  if (options.hasOwnProperty('options')) {
    options = options.options;
  }

  var viewType = options.viewType || [];

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
    var view = app.find(name, type || 'pages');
    return view ? view.content : '';
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
      if (!utils.isView(view)) {
        app.emit('error', 'missing ' + single + ' `' + name + '`');
        return cb(null, '');
      }

      switch(args.length) {
        case 2:
          options = args.pop();
          locals = args[0];
          break;
        case 1:
          options = {};
          locals = args[0];
          break;
        case 0:
          options = {};
          locals = {};
          break;
        default: {
          locals = {};
        }
      }

      var ctx = {};
      merge(ctx, this.context.view.data);
      merge(ctx, this.context);
      merge(ctx, view.locals);
      merge(ctx, view.data);
      merge(ctx, locals);

      return view.render(ctx, function (err, res) {
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
