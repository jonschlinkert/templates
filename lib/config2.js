'use strict';

const util = require('util');
const typeOf = require('kind-of');

module.exports = function(app) {
  const config = {
    defaults: {
      asyncHelpers: {
        valid: val => typeof val === 'boolean',
        value: false
      },
      compileLayout: {
        valid: val => typeof val === 'boolean',
        value: true
      },
      engine: {
        valid: val => isObject(val) || val === false,
        value: 'noop'
      },
      helpers: {
        valid: val => isObject(val),
        value: void 0
      },
      kind: {
        valid: val => ['renderable', 'layout', 'partial'].includes(val),
        value: 'renderable',
        description: 'When registering a collection, the "kind" option describes how the views in the collection will be used. This value helps the engine understand what to do with the views during the render cycle.'
      },
      layoutHistory: {
        valid: val => typeof val === 'boolean',
        value: void 0
      },
      layouts: {
        valid: val => isObject(val) || val === false,
        value: void 0
      },
      partials: {
        valid: val => isObject(val),
        value: void 0,
      },
      preserveWhitespace: {
        description: 'Preserve whitespace indentation when applying layouts.',
        valid: val => typeof val === 'boolean',
        value: false,
      },
      recompile: {
        valid: val => typeof val === 'boolean',
        value: false,
      },
      renameKey: {
        valid: val => typeof val === 'function',
        value: void 0
      },
      renderLayout: {
        type: typeof val === 'boolean',
        value: true,
      },
      render: {
        type: typeof val === 'boolean',
        value: true,
      },
      reregisterHelpers: {
        type: typeof val === 'boolean',
        value: true,
      },
      resolveLayout: {
        valid: val => typeof val === 'function',
        value: void 0,
      },
      read: {
        valid: val => typeof val == 'boolean',
        value: true,
      },
      sync: {
        valid: val => typeof val == 'boolean',
        value: false,
      },
      transform: {
        valid: val => typeof val === 'function',
        value: void 0
      },
      trim: {
        valid: val => typeof val === 'boolean',
        value: void 0
      }
    },
    get(key, value) {
      const option = config.defaults[key];
      if (typeof value === 'undefined') {
        return option.value;
      }
      if (!option.isValid(value)) {
        throw new TypeError(`expected "options.${key}" to be a ${type}`);
      }
      return value;
    }
  };

  return config;
};
