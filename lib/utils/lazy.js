'use strict';

var utils = require('lazy-cache')(require);
var fn = require;
require = utils; // eslint-disable-line

/**
 * Plugins for [base](https://github.com/node-base/base)
 */

require('base-data');
require('base-option', 'option');
require('base-plugins', 'plugin');

/**
 * Common utils
 */

require('array-sort', 'sortBy');
require('clone');
require('clone-stats');
require('deep-bind', 'bindAll');
require('define-property', 'define');
require('extend-shallow', 'extend');
require('falsey', 'isFalsey');
require('get-value', 'get');
require('get-view');
require('group-array', 'groupBy');
require('has-glob');
require('has-value', 'has');
require('match-file');
require('mixin-deep', 'merge');
require('paginationator');
require('set-value', 'set');

/**
 * Middleware and routes
 */

require('en-route', 'router');

/**
 * Engines, templates, helpers and related utils
 */

require('engine-base', 'engine');
require('engine-cache', 'Engines');
require('inflection', 'inflect');
require('layouts');
require('load-helpers', 'loader');
require('template-error', 'rethrow');
require = fn; // eslint-disable-line

/**
 * Expose utils
 */

module.exports = utils;
