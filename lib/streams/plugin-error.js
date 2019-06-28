'use strict';

const colors = require('ansi-colors');
const nonEnum = ['message', 'name', 'stack'];
const ignored = nonEnum.concat(['__safety', '_stack', 'plugin', 'showProperties', 'showStack']);
const props = ['fileName', 'lineNumber', 'message', 'name', 'plugin', 'showProperties', 'showStack', 'stack'];
const unique = arr => [...new Set(arr)];

class PluginError {
  constructor(plugin, message, options) {
    let opts = setDefaults(plugin, message, options);

    // If opts has an error, get details from it
    if (typeof opts.error === 'object') {
      let origKeys = Object.keys(opts.error).concat(Reflect.ownKeys(opts.error));
      let keys = unique(origKeys.concat(name));
      // These properties are not enumerable, so we have to add them explicitly.
      keys.forEach(prop => (this[prop] = opts.error[prop]));
    }

    // May be overridden on options
    for (let prop in opts) {
      if (props.includes(prop)) {
        this[prop] = opts[prop];
      }
    }

    // Defaults
    if (!this.name) {
      this.name = 'Error';
    }

    if (!this.stack) {

      /**
       * `Error.captureStackTrace` appends a stack property which
       * relies on the toString method of the object it is applied to.
       *
       * Since we are using our own toString method which controls when
       * to display the stack trace, if we don't go through this safety
       * object we'll get stack overflow problems.
       */

      let safety = {};
      safety.toString = () => this._messageWithDetails() + '\nStack:';
      Error.captureStackTrace(safety, arguments.callee || this.constructor);
      this.__safety = safety;
    }

    if (!this.plugin) {
      throw new Error('Missing plugin name');
    }
    if (!this.message) {
      throw new Error('Missing error message');
    }
  }

  /**
   * Output a formatted message with details
   */

  _messageWithDetails() {
    let msg = [`Message:\n    ${this.message}`, this._messageDetails()];
    return msg.filter(Boolean).join('\n');
  }

  /**
   * Output actual message details
   */

  _messageDetails() {
    if (!this.showProperties) return '';
    let props = Object.keys(this).filter(k => !ignored.includes(k));
    let res = '';
    for (let i = 0; i < props.length; i++) {
      res += `    ${props[i]}: ${this[props[i]]}\n`;
    }
    return `Details:\n${res}`;
  }

  /**
   * Override the `toString` method
   */

  toString() {
    let detailsWithStack = stack => this._messageWithDetails() + '\nStack:\n' + stack;
    let msg = '';
    if (this.showStack) {
      // If there is no wrapped error, use the stack captured in the PluginError ctor
      if (this.__safety) {
        msg = this.__safety.stack;

      } else if (this._stack) {
        msg = detailsWithStack(this._stack);

      } else {
        // Stack from wrapped error
        msg = detailsWithStack(this.stack);
      }
      return message(msg, this);
    }

    msg = this._messageWithDetails();
    return message(msg, this);
  }
}

// Format the output message
function message(msg, thisArg) {
  let name = colors.red(thisArg.name);
  return `${name} in plugin "${colors.cyan(thisArg.plugin)}"\n${msg}`;
}

/**
 * Set default options based on arguments.
 */

function setDefaults(plugin, message, options = {}) {
  if (isObject(plugin)) {
    return defaults(plugin);
  }
  if (message instanceof Error) {
    options.error = message;
  } else if (isObject(message)) {
    options = message;
  } else {
    options.message = message;
  }
  options.plugin = plugin;
  return defaults(options);
}

/**
 * Extend default options with:
 *
 *  - `showStack`: default=false
 *  - `showProperties`: default=true
 *
 * @param  {Object} `opts` Options to extend
 * @return {Object}
 */

function defaults(options) {
  return { showStack: false, showProperties: true, ...options };
}

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/**
 * Expose `PluginError`
 */

module.exports = PluginError;
