'use strict';

var BaseMethods = require('base-methods');

/**
 * Inherit `Base`. This class is used to provide baseline
 * methods for all classes on the templates API.
 *
 * ```js
 * function App() {
 *   Base.call(this);
 * }
 * Base.extend(App);
 * ```
 */

function Base() {
  BaseMethods.apply(this, arguments);
  this.use(require('base-plugins'));
  this.use(require('base-options'));
}

/**
 * Inherit `BaseMethods`
 */

BaseMethods.extend(Base);

/**
 * Expose `Base`
 */

module.exports = Base;
