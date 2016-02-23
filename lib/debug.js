'use strict';

var utils = require('./utils/');

module.exports = function(app) {
  return utils.debug(app, [
    'collection',
    'context',
    'engine',
    'helper',
    'helpers',
    'item',
    'layout',
    'list',
    'lookup',
    'plugin',
    'render',
    'routes',
    'view',
    'views'
  ]);
};
