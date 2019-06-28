'use strict';

const SCOPED_PKG_REGEXP = /(?:^|\/)(@[^/?]+?)(?=%2f|\/)/;
const colors = require('ansi-colors');
const commands = require('./commands');
const findCwd = require('./tools/find-cwd');
const utils = require('./utils');

const valid = (value, option) => {
  if (option.type.includes(utils.typeOf(value))) {
    return true;
  }
  if (option.type.includes(value)) {
    return true;
  }
  return value === option.value;
};

module.exports = (options = {}) => {
  const queue = [];
  const config = {};
  const defaults = {
    app_name: {
      description: 'Name of the current application being run.',
      type: 'string',
      value: options.app_name || 'generate'
    },

    app_title: {
      description: '',
      type: 'string',
      value() {
        return utils.titleize(config.app_name);
      }
    },

    async_helpers: {
      description: 'Enable async template helpers',
      type: 'boolean',
      value: false,
      valid
    },

    toolkit_dir: {
      description: 'Base toolkit directory name. This is a constant and may not be redefined.',
      type: 'string',
      value: 'toolkit',
      constant: true
    },

    boot_sequence: {
      description: '',
      type: 'array',
      value: ['defaults', 'profile', 'package', 'project', 'env', 'argv'],
      valid(value, option) {
        return Array.isArray(value) && value.every(key => option.value.includes(key));
      }
    },

    cache_dir: {
      description: '',
      type: 'string'
    },

    cli_command: {
      description: 'CLI command',
      type: 'string',
      value(opts) {
        return opts.app_name === 'generate' ? 'gen' : opts.app_name;
      }
    },

    collection_method: {
      description: 'Decorate collection methods (e.g. `app.pages()`) onto app.',
      type: 'boolean',
      valid: value => typeof value === 'boolean',
      value: true
    },

    commands: {
      description: '',
      type: 'array',
      value: commands
    },

    compile_layout: {
      description: '',
      type: 'boolean',
      valid: value => typeof value === 'boolean',
      value: true
    },

    components: {
      description: '',
      type: ['object', null],
      valid: value => utils.isObject(value)
    },

    config_dir: {
      description: '',
      type: 'string'
    },

    config_prop: {
      description: '',
      type: 'string',
      value: '${app_name}Config'
    },

    cwd: {
      description: 'Current working directory',
      type: 'string',
      value: process.cwd(),
      valid
    },

    data_dir: {
      description: '',
      type: 'string'
    },

    default_collection_type: {
      description: 'When registering a collection, the "type" option describes how the files in the collection will be used. This value helps the engine understand what to do with the files during the render cycle.',
      type: 'string',
      valid: value => ['renderable', 'layout', 'partial', 'component'].includes(value),
      value: 'renderable'
    },

    default_engine: {
      description: '',
      type: ['object', false, null],
      value: 'noop',
      valid
    },

    default_layout: {
      description: '',
      type: ['object', 'string'],
      valid: value => utils.isObject(value) || typeof value === 'string',
      value: void 0
    },

    enforce_unique_names: {
      description: '',
      type: 'boolean',
      value: null
    },

    filter_npm_paths: {
      description: '',
      type: 'function'
    },

    find_up: {
      description: '',
      type: 'boolean',
      value: false
    },

    handlers: {
      description: 'Middleware handlers to run during the build and render cycles.',
      type: 'array',
      value: ['onLoad', 'preWrite', 'postWrite']
    },

    helpers: {
      description: '',
      type: ['array', 'object'],
      value: [],
      valid
    },

    home_config_files: {
      description: '',
      type: ['array', 'string'],
      value: ['config.ini', 'config.json', 'config.toml', 'config.yaml', 'config.yml']
    },

    keywords: {
      description: '',
      type: ['array'],
      value: [`${options.app_name}generator`, `${options.app_name}plugin`]
    },

    layout_history: {
      description: '',
      type: 'boolean',
      valid: value => typeof value === 'boolean',
      value: void 0
    },

    layouts: {
      description: '',
      type: ['object'],
      valid: value => utils.isObject(value) || value === false,
      value: void 0
    },

    module_scope: {
      description: '',
      type: 'string',
      value: '@${app_name}'
    },

    omit_keys: {
      description: '',
      constant: true,
      type: 'array',
      value: ['omit_keys']
    },

    package_manager: {
      description: '',
      type: 'string',
      value: process.env.TOOLKIT_PKG_MGR || 'npm'
    },

    partials: {
      description: '',
      type: ['object', null],
      valid: value => utils.isObject(value)
    },

    platform: {
      description: '',
      type: 'string',
      value: process.platform
    },

    plugins: {
      description: '',
      type: ['array', 'object'],
      value: []
    },

    preserve_whitespace: {
      description: 'Preserve whitespace indentation when applying layouts.',
      type: 'boolean',
      valid: value => typeof value === 'boolean',
      value: false
    },

    profile_name: {
      description: '',
      type: 'string',
      value: options.profile_name || process.env.TOOLKIT_PROFILE_NAME || 'default'
    },

    profiles: {
      description: '',
      type: 'object',
      value: {}
    },

    project_config_files: {
      description: '',
      type: ['array', 'string'],
      value: ['.${app_name}.ini', '.${app_name}.json', '.${app_name}.toml', '.${app_name}.yaml', '.${app_name}.yml']
    },

    project_files: {
      description: '',
      type: 'boolean',
      value: false
    },

    recompile: {
      description: '',
      type: ['boolean', null],
      valid: value => typeof value === 'boolean',
      value: false
    },

    rename_key: {
      description: '',
      type: 'function',
      valid: value => typeof value === 'function',
      value: void 0
    },

    render_layout: {
      description: '',
      type: ['boolean', null],
      valid: value => typeof value === 'boolean',
      value: true
    },

    render: {
      description: '',
      type: ['boolean', null],
      valid: value => typeof value === 'boolean',
      value: true
    },

    reregister_helpers: {
      type: ['boolean', null],
      valid: value => typeof value === 'boolean',
      value: true
    },

    resolve_layout: {
      description: '',
      type: ['function', null],
      valid: value => typeof value === 'function',
      value: void 0
    },

    read: {
      description: '',
      type: ['boolean', null],
      valid: value => typeof value === 'boolean',
      value: true
    },

    runtime_dir: {
      description: '',
      type: 'string'
    },

    search_module_paths: {
      description: '',
      type: 'boolean',
      value: false
    },

    streams: {
      description: 'Disable streams. Can slightly improve runtime performance if you are not using the streams interface.',
      type: 'boolean',
      valid: value => typeof value === 'boolean',
      value: false
    },

    styles: {
      description: '',
      type: 'object',
      value: {
        danger: colors.red,
        warning: colors.yellow,
        success: colors.green,
        muted: colors.dim,
        disabled: colors.gray,
        dark: colors.dim.gray
      }
    },

    sync: {
      description: '',
      type: 'boolean',
      valid: value => typeof value === 'boolean',
      value: false
    },

    transform: {
      description: '',
      type: ['function', null],
      valid: value => typeof value === 'function',
      value: void 0
    },

    trim: {
      description: '',
      type: 'boolean',
      valid: value => typeof value === 'boolean',
      value: void 0
    },

    task_file: {
      description: 'User-defined JavaScript file for running tasks.',
      type: 'string',
      value(config) {
        return config.app_name === 'generate' ? 'generator.js' : '${app_name}file.js';
      }
    },

    variable_keys: {
      description: '',
      type: 'array',
      reserved: true,
      value: [
        'app_name',
        'cache_dir',
        'cli_command',
        'config_dir',
        'config_prop',
        'cwd',
        'data_dir',
        'module_scope',
        'package_manager',
        'profile_name',
        'runtime_dir'
      ]
    }
  };

  for (let key of Object.keys(defaults)) {
    let value = [options[key], defaults[key].value].find(v => v != null);
    if (value != null) {
      config[key] = value;
    }
  }

  for (let key of Object.keys(defaults)) {
    let value = set(key, options[key], defaults, config, queue);
    if (value != null) {
      config[key] = value;
    }
  }

  for (let option of queue) {
    config[option.key] = option.value(config);
  }

  if (config.find_up === true) {
    config.cwd = findCwd(config.cwd);
  }

  return utils.substitute(config, config);
};

function set(key, value, defaults, config, queue) {
  let option = defaults[key];
  if (option === void 0) {
    throw new Error('Invalid Option: ' + key);
  }

  let types = [].concat(option.types || []);
  if (option.constant === true || value == null) {
    if (typeof option.value === 'function') {
      queue.push({ key, value: option.value });
      return;
    }
    return option.value;
  }

  if (typeof option.valid === 'function' && option.valid(value, option) === false) {
    throw new TypeError(`Invalid value: "options.${key}"`);
  }

  if (types.length && !types.includes(value) && !types.includes(utils.typeOf(value))) {
    throw new TypeError(`Expected "options.${key}" to be type: ${types.join(', ')}`);
  }

  return value;
}
