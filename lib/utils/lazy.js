'use strict';

/**
 * Lazily required module dependencies
 */

var lazy = require('lazy-cache')(require);

// object/array/type utils
lazy('clone');
lazy('is-buffer');
lazy('paginationator');
lazy('array-sort', 'sortBy');
lazy('group-array', 'groupBy');
lazy('define-property', 'define');
lazy('mixin-deep', 'merge');
lazy('extend-shallow', 'extend');

// routing
lazy('en-route', 'router');

// engines, templates and helpers
lazy('load-helpers', 'loader');
lazy('engine-base', 'engine');
lazy('engine-cache', 'Engines');
lazy('helper-cache', 'Helpers');
lazy('template-error', 'rethrow');
lazy('inflection', 'inflect');
lazy('layouts');

// glob/matching utils
lazy('globby');
lazy('micromatch', 'mm');
lazy('is-valid-glob');
lazy('has-glob');

module.exports = lazy;
