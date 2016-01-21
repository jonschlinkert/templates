'use strict';

/**
 * Lazily required module dependencies
 */

/* eslint-disable no-native-reassign */
var utils = require('lazy-cache')(require);
var fn = require;
/* eslint-disable no-undef */
require = utils;

/**
 * Plugins for [base](https://github.com/node-base/base)
 */

require('base-data');
require('base-options', 'option');

/**
 * Common utils
 */

require('array-sort', 'sortBy');
require('clone');
require('define-property', 'define');
require('extend-shallow', 'extend');
require('group-array', 'groupBy');
require('has-glob');
require('mixin-deep', 'merge');
require('paginationator');

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
require = fn;

/**
 * Expose utils
 */

module.exports = utils;
