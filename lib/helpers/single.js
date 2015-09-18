'use strict';

var utils = require('../utils');

module.exports = function (app, collection, options) {
  var plural = options.plural;
  var single = options.inflection;

  // if `options` is an instance of `view`, get `view.options`
  if (options.hasOwnProperty('options')) {
    options = options.options;
  }
  var viewType = options.viewType || [];


  app.helper('view', function (name, type) {
    if (typeof type === 'string') {
      type = app.views[type];
    } else {
      type = 'pages';
    }
    return app.find(name, type);
  });

  /**
   * Create async helpers for each default template `type`.
   *
   * @param {String} `type` The type of template.
   * @param {String} `plural` Plural form of `type`.
   */

  if (viewType.indexOf('partial') > -1) {
    app.asyncHelper(single, collectionHelper);
  }

  function collectionHelper(key, locals, opts, cb) {
    var args = [].slice.call(arguments, 1);
    cb = args.pop();

    try {
      var view = app.getView(plural, key);
      if (!Object.keys(view).length) {
        view = collection[key];
      }

      if (!view || !Object.keys(view).length) {
        app.emit('error', 'missing ' + single + ' `' + key + '`');
        return cb(null, '');
      }

      var locs = utils.getLocals.apply(utils.getLocals, args);
      locs = locs || {};
      var ctx = utils.merge({}, this.context.view.locals, view.context(locs));

      view.render(ctx, function (err, res) {
        if (err) return cb(err);
        return cb(null, res.content);
      });

    } catch(err) {
      err.reason = 'error in helper: ' + single + ': ' + key;
      app.emit('error', err);
      cb(null, '');
    }
  }
};
