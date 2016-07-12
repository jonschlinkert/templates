'use strict';

var utils = require('../utils');

/**
 * This plugin is used by the main application instance
 * to hook into methods on a group instance that are created through the application instance.
 */

module.exports = function(app, group, options) {
  if (!utils.isValid(group, 'templates-plugins-group', ['group'])) {
    return;
  }

  var create = group.create;
  group.define('create', function(name, props, options) {
    if (typeof props === 'object' && !Array.isArray(props)) {
      options = props;
      props = [];
    }
    options = options || {};

    var collection = create.apply(this, arguments);
    var views = app.create(name, options);
    group.run(views);

    if (options.permalinks) {
      views.use(options.permalinks);
    }
    views.addViews(collection.items);
    return collection;
  });
};
