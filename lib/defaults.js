'use strict';

const utils = require('./utils');

const config = {
  defaults: {
    asyncHelpers: {
      description: 'Enable support for async template helpers. Note that while this feature is extensively tested to work in maintream use cases, it should be considered experimental. Please report any issues encountered with this enabled.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: false
    },
    collectionMethod: {
      description: 'Decorate collection methods onto the "app" instance. Example: `app.create("pages", { collectionMethod: true })` will add the `app.pages()` method to the instance.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: true
    },
    recompileLayout: {
      description: 'Re-compile layouts each time they are applied.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: true
    },
    defaultLayout: {
      description: 'The name of the default layout to use. May be specified on the app or collections.',
      type: ['object', 'string'],
      valid: val => utils.isObject(val) || typeof val === 'string'
    },
    engine: {
      description: 'The name of the built-in or registered template engine to use for rendering all templates by default.',
      type: 'string',
      valid: val => typeof val === 'string',
      default: 'noop'
    },
    helpers: {
      description: 'Object of template helper functions to use pass to engines for rendering templates.',
      type: 'object',
      valid: val => utils.isObject(val)
    },
    type: {
      description: 'When registering a collection, the "type" option describes how the files in the collection will be used. This default helps the engine understand what to do with the files during the render cycle.',
      type: 'string',
      valid: val => ['renderable', 'layout', 'partial', 'component'].includes(val),
      default: 'renderable'
    },
    layoutHistory: {
      description: 'Optional array to use for caching layouts as they are applied during the render cycle. Useful for debugging, but be mindful to avoid memory leaks.',
      type: 'array',
      valid: val => Array.isArray(val)
    },
    layouts: {
      description: 'Collection, object, or Map of layouts (file objects) to pass to the layout engine when rendering layouts.',
      type: 'object',
      valid: val => utils.isObject(val) || val === false
    },
    components: {
      description: '',
      type: ['object', null],
      valid: val => utils.isObject(val)
    },
    partials: {
      description: 'Collection, object, or Map of partials (file objects) to pass to template engines when rendering templates.',
      type: 'object',
      valid: val => utils.isObject(val) || val === false
    },
    preserveWhitespace: {
      description: 'Preserve whitespace indentation when applying layouts.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: false
    },
    recompile: {
      description: 'Force templates to be recompiled at render time.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: false
    },
    renameKey: {
      description: 'Custom function to use for creating the keys to use for caching templates.',
      type: 'function',
      valid: val => typeof val === 'function'
    },
    renderLayout: {
      description: 'Disable rendering of layouts.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: true
    },
    render: {
      description: 'Disabled rendering for all templates.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: true
    },
    resolveLayout: {
      description: 'Custom function to use for resolving layouts during the render cycle.',
      type: ['function', null],
      valid: val => typeof val === 'function'
    },
    streams: {
      description: 'Disable streams. Can slightly improve runtime performance if you are not using the streams interface.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: false,
    },
    sync: {
      description: 'Render templates and run all middleware synchronously.',
      type: 'boolean',
      valid: val => typeof val === 'boolean',
      default: false
    },
    trimContents: {
      description: 'Remove extraneous leading and trailing newlines from contents when applying layouts',
      type: 'boolean',
      valid: val => typeof val === 'boolean'
    },
    enforceUniquePartialNames: {
      description: 'Enforce unique names for partials across one or more collections',
      type: 'boolean',
      default: null
    }
  }
};

config.get = (key, value, fallback) => {
  let option = config.defaults[key] || {};
  let types = [].concat(option.type || []);
  let err = `expected "options.${key}" to be of type: ${types.join(', ')}`;

  if (value === void 0) value = fallback;
  if (value === void 0) value = option.default;
  if (value === void 0) {
    if (option.required === true) throw new TypeError(err);
    return;
  }

  if (typeof option.valid === 'function' && option.valid(value) === false) {
    throw new TypeError(err);
  }

  return value;
};

module.exports = config;
