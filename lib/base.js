'use strict';

var Base = require('base');

/**
 * Expose `TemplatesBase`
 */

module.exports = TemplatesBase;

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

function TemplatesBase() {
  Base.apply(this, arguments);
  this.use(require('base-plugins')());
  this.use(require('base-options')());
}

/**
 * Inherit `Base`
 */

Base.extend(TemplatesBase);
