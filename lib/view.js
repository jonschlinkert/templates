'use strict';

const { isObject } = require('./utils');
const endsWith = require('path-ends-with');
const assert = require('assert');
const path = require('path');
const util = require('util');
const utils = require('./utils');

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

class View {
  constructor(view = {}) {
    assert(isObject(view), 'expected view to be an object');
    this.type = 'view';
    this.data = {};
    this.history = [];
    this.contents = view.contents || null;
    this.cwd = view.cwd || process.cwd();
    this.base = view.base || this.cwd;
    this.stat = view.stat || null;
    if (view.path) this.path = view.path;
    for (const key in view) {
      if (!View.isBuiltIn(key)) {
        this[key] = view[key];
      }
    }
  }

  [util.inspect.custom]() {
    let inspect = this.path && this.base ? [`"${this.relative}"`] : [];
    if (this.path && this.path[0] === '/') inspect = [`"${this.path}"`]
    if (this.isBuffer()) inspect.push(this.contents.inspect());
    if (this.isStream()) inspect.push(inspectStream(this.contents));
    return `<${this.constructor.name} ${inspect.join(' ')}>`;
  }

  clone() {
    const view = new this.constructor(this);
    if (this.isBuffer()) {
      view.contents = Buffer.from(this.contents);
    }
    return view;
  }

  reset() {
    delete this.layoutStack;
    this._contents = this._originalContents;
    this.fn = null;
  }

  isNull() {
    return this.contents === null;
  }

  isBuffer() {
    return utils.isBuffer(this.contents);
  }

  isStream() {
    return utils.isObject(this.contents) && typeof this.contents.pipe === 'function';
  }

  isDirectory() {
    if (!this.isNull()) {
      return false;
    }
    if (this.stat && typeof this.stat.isDirectory === 'function') {
      return this.stat.isDirectory();
    }
    return false;
  }

  isSymbolicLink() {
    if (!this.isNull()) {
      return false;
    }
    if (this.stat && typeof this.stat.isSymbolicLink === 'function') {
      return this.stat.isSymbolicLink();
    }
    return false;
  }

  isAbsolute() {
    return path.isAbsolute(this.path);
  }

  hasPath(val) {
    if (!this.path) return false;
    if (typeof val === 'function') return val(this);
    if (val instanceof RegExp) {
      return val.test(this.path) || val.test(this.history[0]);
    }
    return this.pathEndsWith(val) || val === this.stem;
  }

  pathEndsWith(substr) {
    return endsWith(this.path, substr) || endsWith(this.history[0], substr);
  }

  rename(structure, locals) {
    this.path = utils.format(structure, Object.assign({}, this, locals, this.data));
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
   * Get or set the current working directory. This is used for resolving
   * the absolute path for the view.
   */

  set cwd(val) {
    this._cwd = val;
  }
  get cwd() {
    return path.resolve(this._cwd);
  }

  /**
   * Get or set the base path. This is used for creating the `view.relative` path.
   */

  set base(base) {
    this._base = base;
  }
  get base() {
    return this._base ? path.resolve(this._base) : this.cwd;
  }

  /**
   * Get or set the `view.path`.
   */

  set path(filepath) {
    if (filepath === '') return;

    assert.equal(typeof filepath, 'string', 'expected view.path to be a string');
    const val = path.normalize(filepath);
    if (val !== this.path) {
      this.history.push(val);
    }
  }
  get path() {
    return this.history[this.history.length - 1];
  }

  /**
   * Get or set `view.symlink`
   */

  set symlink(val) {
    this._symlink = val;
  }
  get symlink() {
    return this._symlink ? path.normalize(this._symlink) : '';
  }

  /**
   * Get the absolute `view.path`. This is automatically created and cannot
   * be directly set.
   */

  get absolute() {
    return path.resolve(this.path);
  }

  /**
   * Get the relative path from `view.base`. This is automatically created
   * and cannot be directly set.
   */

  get relative() {
    return path.relative(this.base, this.path);
  }

  /**
   * Get or set the dirname of the `view.path`.
   */

  set dirname(dirname) {
    this.path = path.join(dirname, this.basename);
  }
  get dirname() {
    return path.dirname(this.path);
  }

  /**
   * Get or set the folder of the `view.path`.
   */

  set folder(folder) {
    this.path = path.join(path.dirname(this.dirname), folder, this.basename);
  }
  get folder() {
    return path.basename(this.dirname);
  }

  /**
   * Get or set the basename of the `view.path`.
   */

  set basename(basename) {
    this.path = path.join(this.dirname, basename);
  }
  get basename() {
    return path.basename(this.path);
  }

  /**
   * Get or set the `stem` of the `view.path`.
   * @name stem
   * @param {String} `stem`
   * @return {String}
   * @api public
   */

  set stem(stem) {
    this.basename = stem + this.extname;
  }
  get stem() {
    return path.basename(this.path, this.extname);
  }

  /**
   * Get or set the `extname` of the `view.path`.
   * @name extname
   * @param {String} `extname`
   * @return {String}
   * @api public
   */

  set extname(extname) {
    this.basename = this.stem + extname;
  }
  get extname() {
    return path.extname(this.path);
  }

  /**
   * Get or set `view.contents`.
   */

  set contents(val) {
    if (typeof val === 'string') val = Buffer.from(val);
    if (!View.isValidContents(val)) {
      throw new TypeError('expected view.contents to be a buffer, stream, or null');
    }
    if (!this._originalContents) {
      this._originalContents = val;
    }
    this._contents = val;
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

  set render(val) {
    this._render = val === true;
  }
  get render() {
    if (typeof this._render !== 'boolean') {
      return this.engine !== false;
    }
    return this._render;
  }

  get _isView() {
    return true;
  }
  get _isVinyl() {
    return true;
  }

  static isValidContents(val) {
    return val === null || utils.isBuffer(val) || utils.isStream(val);
  }
  static isValid(view) {
    return this.isView(view);
  }
  static isView(view) {
    return utils.isObject(view) && view._isView === true;
  }
  static isVinyl(view) {
    return this.isView(view);
  }
  static isBuiltIn(key) {
    return this.builtins.includes(key);
  }
  static get builtins() {
    return [
      '_base',
      '_contents',
      '_cwd',
      '_isView',
      '_isVinyl',
      '_symlink',
      'absolute',
      'base',
      'constructor',
      'contents',
      'cwd',
      'history',
      'isBuffer',
      'isDirectory',
      'isNull',
      'isStream',
      'isSymbolic',
      'isSymbolicLink',
      'path',
      'relative'
    ];
  }
}

function inspectStream(stream) {
  return '<' + stream.constructor.name.replace('Stream', '') + 'Stream>';
}

function first(args) {
  for (const ele of args) {
    if (ele != null) {
      return ele;
    }
  }
}

/**
 * Expose `View`
 */

module.exports = View;
