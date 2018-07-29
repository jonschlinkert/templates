'use strict';

const assert = require('assert');
const path = require('path');
const util = require('util');
const File = require('./file');
const { endsWith, first, isBinaryFile, isObject } = require('./utils');

/**
 * Create a new `View`.
 *
 * ```js
 * new View({ path: 'path/to/file.hbs' });
 * new View({ path: 'path/to/file.hbs', contents: Buffer.from('...') });
 * ```
 * @name View
 * @param {Object} `view`
 * @api public
 */

class View extends File {
  constructor(view = {}) {
    assert(isObject(view), 'expected view to be an object');
    super(view);
    this.data = view.data || {};
  }

  [util.inspect.custom]() {
    let inspect = this.path && this.base ? [`"${this.relative}"`] : [];
    if (this.path && this.path[0] === '/') inspect = [`"${this.path}"`];
    if (this.isBuffer()) inspect.push(this.contents.inspect());
    if (this.isStream()) inspect.push(inspectStream(this.contents));
    return `<${this.constructor.name} ${inspect.join(' ')}>`;
  }

  reset() {
    delete this.layoutStack;
    this._contents = this._originalContents;
    this.fn = null;
  }

  isBinary() {
    return isBinaryFile(this);
  }

  hasPath(val) {
    if (!this.path) return false;
    if (typeof val === 'function') return val(this);
    if (val instanceof RegExp) {
      return val.test(this.path) || val.test(this.history[0]);
    }
    return this.pathEndsWith(val) || val === this.stem;
  }

  pathEndsWith(substr, options) {
    if (endsWith(this.path, substr, options)) return true;
    return endsWith(this.history[0], substr, options);
  }

  /**
   * Get or set the `view.key`.
   */

  set key(val) {
    this._key = val;
  }
  get key() {
    return this._key || this.path;
  }

  /**
   * Get or set `view.contents`.
   */

  set contents(val) {
    if (typeof val === 'string') val = Buffer.from(val);
    super.contents = val;
  }
  get contents() {
    return this._contents;
  }

  /**
   * Resolve the name of the layout to use, if applicable.
   * @param {String} `name`
   * @return {String}
   */

  set layout(val) {
    this._layout = val;
  }
  get layout() {
    const layout = first([this._layout, this.data.layout]);
    if (layout === 'default' && this.kind === 'partial') {
      return undefined;
    }
    return layout;
  }

  /**
   * Resolve the name of the engine to use, or the view
   * extension to be use for getting the rendering engine.
   * @param {String} `name`
   * @return {String}
   */

  set engine(val) {
    this._engine = val;
  }
  get engine() {
    if (this._engine === false) return this._engine;
    let engine = first([this.data.engine, this._engine, this.extname]);
    if (engine && engine[0] !== '.') {
      engine = '.' + engine;
    }
    return engine;
  }

  /**
   * Getter/setter the returns true or false if the view should be rendered.
   * @return {Boolean}
   */

  set render(val) {
    this._render = val === true;
  }
  get render() {
    if (typeof this._render !== 'boolean') {
      return this.engine !== false;
    }
    return !!this._render;
  }

  get _isView() {
    return true;
  }

  static isView(view) {
    return isObject(view) && view._isView === true;
  }
  static isValid(view) {
    return this.isView(view);
  }
}

function inspectStream(stream) {
  return `<${stream.constructor.name.replace('Stream', '')}Stream>`;
}

/**
 * Expose `View`
 */

module.exports = View;
