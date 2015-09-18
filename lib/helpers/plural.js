'use strict';

var List = require('../list');
var utils = require('../utils');

module.exports = function (app, collection, options) {

  /**
   * Create sync helpers for each view collection
   *
   * @param {String} `plural` Pluralized name of the collection.
   * @api private
   */

  app.helper(options.plural, function (context) {
    var ctx = new List(collection);
    return context.fn(ctx);
  });
};
