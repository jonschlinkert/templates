'use strict';

/**
 * Lazily required module dependencies
 */

/* eslint-disable no-native-reassign */
var utils = require('lazy-cache')(require);
var fn = require;

/**
 * Common utils
 */

/* eslint-disable no-undef */
require = utils;
require('clone');
require('has-glob');
require('paginationator');
require('base-data');
require('base-options', 'option');
require('array-sort', 'sortBy');
require('group-array', 'groupBy');
require('define-property', 'define');
require('extend-shallow', 'extend');
require('mixin-deep', 'merge');
require('word-wrap', 'wrap');

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
require = fn;

/**
 * Expose utils
 */

module.exports = utils;
