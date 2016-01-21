'use strict';

var utils = require('../utils');

/**
 * Default methods and settings that will be decorated onto
 * each view created by a collection.
 */

module.exports = function decorateView(app, view, options) {
  if (typeof view.option !== 'function') {
    if (view.use) {
      view.use(utils.option());
    } else {
      utils.option.call(view, view);
    }
    view.options = utils.extend({}, options, view.options);
  }

  view.compile = function() {
    app.compile.bind(app, this).apply(app, arguments);
    return this;
  };

  view.render = function() {
    app.render.bind(app, this).apply(app, arguments);
    return this;
  };
};
