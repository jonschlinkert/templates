'use strict';

const typeOf = require('kind-of');

module.exports = function(app) {
  const config = {
    defaults: {
      asyncHelpers: {
        type: 'boolean',
        value: false
      },
      engine: {
        type: ['object', false, null],
        value: 'noop'
      },
      helpers: {
        type: ['object', null],
        value: null,
        get(view) {

        }
      },
      kind: {
        description: 'When registering a collection, the "kind" option describes how the views in the collection will be used. This value helps the engine understand what to do with the views during the render cycle.',
        type: 'string',
        valid: ['renderable', 'layout', 'partial'],
        value: 'renderable'
      },
      layouts: {
        type: ['object'],
        value: null,
        get(view) {

        }
      },
      partials: {
        type: ['object', null],
        value: null,
        get(view) {

        }
      },
      preserveWhitespace: {
        description: 'Preserve whitespace indentation when applying layouts.',
        type: 'boolean',
        value: false
      },
      recompile: {
        type: ['boolean', null],
        value: false
      },
      renameKey: {
        type: 'function',
        value: null
      },
      renderLayout: {
        type: ['boolean', null],
        value: true
      },
      render: {
        type: ['boolean', null],
        value: true
      },
      reregisterHelpers: {
        type: ['boolean', null],
        value: true
      },
      resolveLayout: {
        type: ['function', null],
        value: null
      },
      read: {
        type: ['boolean', null],
        value: true
      },
      sync: {
        type: 'boolean',
        value: false
      },
      transform: {
        type: ['function', null],
        value: null
      },
      trim: {
        type: 'boolean',
        value: null
      }
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
