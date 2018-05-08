'use strict';

const util = require('util');
const typeOf = require('kind-of');

module.exports = function(app) {
  const config = {
    defaults: {
      engine: {
        type: ['object', false, null]
        value: 'noop',
      },
      layouts: {
        type: ['object', false, null]
        value: null,
        get(view) {

        }
      },
      recompile: {
        type: ['boolean', null],
        value: false,
      },
      renderLayout: {
        type: ['boolean', null],
        value: true,
      },
      render: {
        type: ['boolean', null],
        value: true,
      },
      read: {
        type: ['boolean', null],
        value: true,
      },
      transform: {
        type: ['function', null],
        value: null
      }
// asyncHelpers
// compileLayout
// engine
// helpers
// history
// kind
// partials
// preserveWhitespace
// recompile
// renameKey
// reregisterHelpers
// resolveLayout
// sync
// transform
// trim
    },
    get(key, value) {
      const fallback = config.defaults[key];
      const type = [].concat(fallback.type);
      if (typeof value === 'undefined') {
        return fallback.value;
      }
      if (type.includes(value) && !type.includes(typeOf(value))) {
        throw new TypeError(`expected "options.${key}" to be a ${type}`);
      }
      return value;
    }
  };

  return config;
};


module.exports = config;
