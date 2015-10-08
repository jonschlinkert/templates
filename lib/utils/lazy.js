'use strict';

/**
 * Lazily required module dependencies
 */

var lazy = require('lazy-cache')(require);
var fn = require;

/**
 * Common utils
 */

require = lazy;
require('clone');
require('is-buffer');
require('paginationator');
require('base-data', 'data');
require('array-sort', 'sortBy');
require('group-array', 'groupBy');
require('define-property', 'define');
require('mixin-deep', 'merge');
require('extend-shallow', 'extend');
require('resolve-glob');

/**
 * Routing
 */

require('en-route', 'router');

/**
 * Engines, templates and helpers utils
 */

require('load-helpers', 'loader');
require('engine-base', 'engine');
require('engine-cache', 'Engines');
require('template-error', 'rethrow');
require('inflection', 'inflect');
require('layouts');

/**
 * Expose utils
 */

require = fn;
module.exports = lazy;
