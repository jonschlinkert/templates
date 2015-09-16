'use strict';

var utils = require('../utils');

module.exports = function (app, collection, options) {
  var plural = options.plural;
  var single = options.inflection;

  /**
   * Create async helpers for each default template `type`.
   *
   * @param {String} `type` The type of template.
   * @param {String} `plural` Plural form of `type`.
   * @api private
   */

  app.helper(plural, function () {
    return app.getViews(plural);
  });

  app.helper('views', function (name) {
    return app.getViews(name);
  });
};
