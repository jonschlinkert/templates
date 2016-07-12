'use strict';

var utils = require('../utils');

/**
 * This plugin is used by the main application instance
 * to hook into methods on groups that are created through the application instance.
 */

module.exports = function(app, groups, options) {
  if (!utils.isValid(groups, 'templates-plugins-groups', ['groups'])) {
    return;
  }

  var create = groups.create;
  groups.define('create', function(name, props, options) {
    if (typeof props === 'object' && !Array.isArray(props)) {
      options = props;
      props = [];
    }
    options = options || {};

    var collection = create.apply(this, arguments);
    var views = app.create(name, options);
    groups.run(views);

    if (options.permalinks) {
      views.use(options.permalinks);
    }
    views.addViews(collection.items);
    return collection;
  });
};
