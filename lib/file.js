'use strict';

const assert = require('assert');
const path = require('path');
const util = require('util');
const Vinyl = require('./vinyl-lite');
const { endsWith, first, isBinaryFile } = require('./utils');

/**
 * Create a new `File`.
 *
 * ```js
 * new File({ path: 'path/to/file.hbs' });
 * new File({ path: 'path/to/file.hbs', contents: Buffer.from('...') });
 * ```
 * @name File
 * @extends Vinyl
 * @param {Object} `file`
 * @api public
 */

class File extends Vinyl {
  constructor(file = {}) {
    assert.equal(typeof file, 'object', 'expected an object');
    super(file);
    this.data = file.data || {};
    this.orig = {
      contents: this.contents,
      history: this.history.slice()
    };
  }

  [util.inspect.custom]() {
    let inspect = this.path && this.base ? [`"${this.relative}"`] : [];
    if (this.path && this.path[0] === '/') inspect = [`"${this.path}"`];
    if (this.isBuffer()) inspect.push(this.contents.inspect());
    if (this.isStream()) inspect.push(inspectStream(this.contents));
    return `<${this.constructor.name} ${inspect.join(' ')}>`;
  }

  reset() {
    this.contents = this.orig.contents;
    this.history = this.orig.history;
    this.layoutHistory = void 0;
    this.layoutFn = void 0;
    this.fn = void 0;
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
   * Get the absolute `file.path`
   */

  get absolute() {
    return path.resolve(this.path);
  }

  /**
   * Get or set the `file.key`.
   */

  set key(val) {
    this._key = val;
  }
  get key() {
    return this._key || this.path;
  }

  /**
   * Get or set `file.contents`.
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
   * Resolve the name of the engine to use, or the file
   * extension to be use for getting the rendering engine.
   * @param {String} `name`
   * @return {String}
   */

  set engine(value) {
    if (value != null && typeof value !== 'string') {
      throw new TypeError('expected file.engine to be a string');
    }
    if (value && value[0] !== '.') value = '.' + value;
    this._engine = value;
  }
  get engine() {
    if (this._engine) return this._engine;
    let first = arr => arr.find(ele => typeof ele === 'string' && ele !== '');
    let args = [this._engine, this.data.engine];
    let firstPath = this.history[0];
    if (firstPath) args.push(path.extname(firstPath));
    let engine = first(args);
    if (engine && engine[0] !== '.') {
      engine = '.' + engine;
    }
    this._engine = engine;
    return engine;
  }

  /**
   * Getter/setter the returns true or false if the file should be rendered.
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

  get isFile() {
    return true;
  }

  static isFile(file) {
    return file instanceof this;
  }

  static isValid(file) {
    return this.isFile(file);
  }
}

function inspectStream(stream) {
  return `<${stream.constructor.name.replace('Stream', '')}Stream>`;
}

/**
 * Expose `File`
 */

module.exports = File;
