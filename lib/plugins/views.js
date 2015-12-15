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

  // decorate `extendView` onto the collection
  views.extendView = app.extendView.bind(app);

  // bubble up custom collection events, like `app.on('page', ...)`
  var inflection = views.options.inflection;
  if (inflection) {
    views.on(inflection, function() {
      app.emit.bind(app, inflection).apply(app, arguments);
    });
  }

  // bubble up `view` events
  views.on('view', function(view, type, collection) {
    utils.define(view, 'addView', views.addView.bind(views));
    if (!view.options.hasOwnProperty('engine')) {
      view.options.engine = views.options.engine;
    }
    app.extendView(view, options);
    app.handleView('onLoad', view);
    app.emit.bind(app, 'view').apply(app, arguments);
  });
};
