

module.exports = function (fn) {
  var lazy = require('lazy-cache')(fn);
  var utils = lazy;

  /**
   * Default router methods used in all Template instances
   */

  utils.methods = [
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

  return utils;
}

