'use strict';

/**
 * Default router methods used in all Template instances
 */

exports.methods = [
  'onLoad',
  'preCompile',
  'preLayout',
  'onLayout',
  'postLayout',
  'onMerge',
  'postCompile',
  'preRender',
  'postRender'
];

/**
 * Options keys
 */

exports.optsKeys = [
  'renameKey',
  'namespaceData',
  'mergePartials',
  'rethrow',
  'nocase',
  'nonull',
  'rename',
  'cwd'
];

/**
 * Constructor keys
 */

exports.constructorKeys = [
  'Item',
  'View',
  'List',
  'Collection',
  'Views',
  'Group',
];
