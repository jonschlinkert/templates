'use strict';

var utils = require('../utils');

/**
 * Default methods and settings that will be decorated onto
 * each collection.
 */

module.exports = function(app, views, options) {
  if (typeof views.options.renameKey !== 'function') {
    views.option('renameKey', function(key, view) {
      return app.renameKey(key, view);
    });
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
  views.on('view', function(view, collectionName, collection) {
    utils.define(view, 'addView', views.addView.bind(views));
    view.engine = views.options.engine || view.engine;
    app.extendView(view, options);
  });

  views.on('load', function(view, collectionName, collection) {
    app.emit.bind(app, 'view').apply(app, arguments);
    app.handleView('onLoad', view);
  });
};
