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
    app.helper(single, collectionHelper);
  }

  function collectionHelper(key, locals, opts) {
    try {
      var view = collection.getView(key);
      if (!utils.isView(view)) {
        view = collection.views[key];
      }

      if (!utils.isView(view)) {
        app.emit('error', 'missing ' + single + ' `' + key + '`');
        return '';
      }

      var ctx = merge({}, this.context);
      merge(ctx, view.locals);
      merge(ctx, view.data);
      merge(ctx, locals);

      view.compile(this.context.view.options);
      return view.fn(ctx);

    } catch(err) {
      err.reason = 'error in helper: ' + single + ': ' + key;
      app.emit('error', err);
      return '';
    }
  }
};
