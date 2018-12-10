'use strict';

const { typeOf, isObject } = require('./utils');

const config = {
  defaults: {
    asyncHelpers: {
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      value: false
    },
    collectionMethod: {
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      value: true,
      description: 'Decorate collection methods (e.g. `app.pages()`) onto app.'
    },
    compileLayout: {
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      value: true
    },

    defaultEngine: {
      type: ['object', false, null],
      valid: val => isObject(val) || val === false,
      value: 'noop'
    },
    defaultLayout: {
      type: ['object', 'string'],
      valid: val => isObject(val) || typeof val === 'string',
      value: void 0
    },

    // TODO - rename to defaultEngine?
    engine: {
      type: ['object', false, null],
      valid: val => isObject(val) || val === false,
      value: 'noop'
    },

    helpers: {
      type: ['object', null],
      valid: val => isObject(val),
      value: void 0,
      get(file) {

      }
    },
    type: {
      type: 'string',
      valid: val => ['renderable', 'layout', 'partial', 'component'].includes(val),
      value: 'renderable',
      description: 'When registering a collection, the "type" option describes how the files in the collection will be used. This value helps the engine understand what to do with the files during the render cycle.'
    },
    layoutHistory: {
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      value: void 0
    },
    layouts: {
      type: ['object'],
      valid: val => isObject(val) || val === false,
      value: void 0,
      get(file) {

      }
    },
    components: {
      type: ['object', null],
      valid: val => isObject(val),
      value: void 0,
      get(file) {

      }
    },
    partials: {
      type: ['object', null],
      valid: val => isObject(val),
      value: void 0,
      get(file) {

      }
    },
    preserveWhitespace: {
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      value: false,
      description: 'Preserve whitespace indentation when applying layouts.'
    },
    recompile: {
      type: ['boolean', null],
      valid: val => typeof val === 'boolean',
      value: false
    },
    renameKey: {
      type: 'function',
      valid: val => typeof val === 'function',
      value: void 0
    },
    renderLayout: {
      type: ['boolean', null],
      valid: val => typeof val === 'boolean',
      value: true
    },
    render: {
      type: ['boolean', null],
      valid: val => typeof val === 'boolean',
      value: true
    },
    reregisterHelpers: {
      type: ['boolean', null],
      valid: val => typeof val === 'boolean',
      value: true
    },
    resolveLayout: {
      type: ['function', null],
      valid: val => typeof val === 'function',
      value: void 0
    },
    read: {
      type: ['boolean', null],
      valid: val => typeof val === 'boolean',
      value: true
    },
    streams: {
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      value: false,
      description: 'Disable streams. Can slightly improve runtime performance if you are not using the streams interface.'
    },
    sync: {
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      value: false
    },
    transform: {
      type: ['function', null],
      valid: val => typeof val === 'function',
      value: void 0
    },
    trim: {
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      value: void 0
    },
    enforceUniqueNames: {
      type: 'boolean',
      value: null
    }
  }
};

config.get = (key, value) => {
  const fallback = config.defaults[key];
  if (fallback === void 0) {
    // reminder: remove before publishing
    // console.log('no config default exists for:', key);
    return;
  }
  const type = [].concat(fallback.type);
  if (value === void 0) {
    return fallback.value;
  }
  if (type.includes(value) && !type.includes(typeOf(value))) {
    throw new TypeError(`expected "options.${key}" to be a ${type}`);
  }
  return value;
};

module.exports = config;
