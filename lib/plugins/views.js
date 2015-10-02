'use strict';

var utils = require('../utils');

/**
 * Default methods and settings that will be decorated onto
 * each collection.
 */

module.exports = function(app, views, options) {
  if (!views.options.hasOwnProperty('renameKey')) {
    views.option('renameKey', app.renameKey);
  }

  views.extendView = app.extendView.bind(app);

  views.on('view', function (view) {
    utils.define(view, 'addView', views.addView.bind(views));

    if (!view.options.hasOwnProperty('engine')) {
      view.options.engine = views.options.engine;
    }

    app.extendView(view, options);
    app.handleView('onLoad', view);
    app.emit('view', view);
  });
};
