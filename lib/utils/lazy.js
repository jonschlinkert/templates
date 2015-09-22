'use strict';

/**
 * Lazily required module dependencies
 */

var lazy = require('lazy-cache')(require);

/**
 * Common utils
 */

lazy('clone');
lazy('is-buffer');
lazy('paginationator');
lazy('array-sort', 'sortBy');
lazy('group-array', 'groupBy');
lazy('define-property', 'define');
lazy('mixin-deep', 'merge');
lazy('extend-shallow', 'extend');

/**
 * Routing
 */

lazy('en-route', 'router');

/**
 * Engines, templates and helpers utils
 */

lazy('load-helpers', 'loader');
lazy('engine-base', 'engine');
lazy('engine-cache', 'Engines');
lazy('helper-cache', 'Helpers');
lazy('template-error', 'rethrow');
lazy('inflection', 'inflect');
lazy('layouts');

/**
 * Globbing and matching utils
 */

lazy('globby');
lazy('is-valid-glob');
lazy('has-glob');

/**
 * Expose utils
 */

module.exports = lazy;
