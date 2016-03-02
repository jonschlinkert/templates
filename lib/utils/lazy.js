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
require('base-logger', 'logger');
require('base-option', 'option');
require('base-plugins', 'plugin');

/**
 * Common utils
 */

require('array-sort', 'sortBy');
require('clone');
require('deep-bind', 'bindAll');
require('define-property', 'define');
require('extend-shallow', 'extend');
require('get-value', 'get');
require('get-view');
require('group-array', 'groupBy');
require('has-glob');
require('has-value', 'has');
require('falsey', 'isFalsey');
require('match-file');
require('mixin-deep', 'merge');
require('paginationator');
require('word-wrap', 'wrap');
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
require = fn;

/**
 * Expose utils
 */

module.exports = utils;
