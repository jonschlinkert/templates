'use strict';

const path = require('path');
const assert = require('assert');
const endsWith = require('path-ends-with');
const typeOf = require('kind-of');
const isString = val => typeof val === 'string';
const isBuffer = val => typeOf(val) === 'buffer';
const isObject = val => typeOf(val) === 'object';
const isStream = val => isObject(val) && typeof val.pipe === 'function';

/**
 * Create a new `View`.
 *
 * ```js
 * new View({ path: 'path/to/file.hbs' });
 * new View({ path: 'path/to/file.hbs', contents: Buffer.from('...') });
 * new View('path/to/file.hbs', { contents: Buffer.from('...') });
 * ```
 * @name View
 * @param {Object} `view`
 * @api public
 */

class View {
  constructor(view = {}) {
    assert(isObject(view), 'expected view to be an object');
    this.type = 'view';
    this.history = [];
    this.cache = {};
    this.data = {};
    this.cwd = view.cwd || process.cwd();
    this.base = view.base || this.cwd;
    this.stat = view.stat;
    if (view.path) this.path = view.path;
    for (const key of Object.keys(view)) {
      if (!View.isBuiltIn(key)) {
        this[key] = view[key];
      }
    }
  }

  inspect() {
    const inspect = this.path && this.base ? [`"${this.relative}"`] : [];
    if (this.isBuffer()) inspect.push(this.contents.inspect());
    if (this.isStream()) inspect.push(inspectStream(this.contents));
    return `<View ${inspect.join(' ')}>`;
  }

  clone() {
    const view = new this.constructor(this);
    if (this.isBuffer()) {
      view.contents = Buffer.from(this.contents);
    }
    return view;
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

  isNull() {
    return this.contents == null;
  }

  isBuffer() {
    return isBuffer(this.contents);
  }

  isStream() {
    return isStream(this.contents);
  }

  isAbsolute() {
    return path.isAbsolute(this.path);
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

  /**
   * Get or set `view.contents`.
   */

  set contents(val) {
    if (typeof val === 'string') val = Buffer.from(val);
    if (val !== null && !isBuffer(val) && !isStream(val)) {
      throw new TypeError('expected view.contents to be a string, buffer, stream, or null');
    }
    this._contents = val;
  }
  get contents() {
    return this._contents;
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
   * Get or set the `view.path`.
   */

  set path(val) {
    assert.equal(typeof val, 'string', 'expected view.path to be a string');
    if (val !== '' && val !== this.path) {
      this.history.push(path.normalize(val));
    }
  }
  get path() {
    return this.history[this.history.length - 1];
  }

  /**
   * Get or set `file.symlink`
   */

  set symlink(val) {
    this._symlink = val;
  }
  get symlink() {
    return this._symlink;
  }

  /**
   * Get or set the current working directory. This is used for resolving
   * the absolute path for the view.
   */

  set cwd(val) {
    this._cwd = path.resolve(val);
  }
  get cwd() {
    return this._cwd;
  }

  /**
   * Get or set the base path. This is used for generating the `view.relative` path.
   */

  set base(val) {
    this._base = val;
  }
  get base() {
    return path.resolve(this._base || this.dirname);
  }

  /**
   * Get or set the dirname of the `view.path`.
   */

  set dirname(val) {
    this.path = path.resolve(val, this.basename);
  }
  get dirname() {
    return path.dirname(this.path);
  }

  /**
   * Get or set the basename of the `view.path`.
   */

  set basename(val) {
    this.path = path.join(this.dirname, val);
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

  set stem(val) {
    this.basename = val + this.extname;
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

  set extname(val) {
    this.basename = this.stem + val;
  }
  get extname() {
    return path.extname(this.path);
  }

  /**
   * Get the absolute `view.path`. This is automatically created and cannot
   * be directly set.
   */

  get absolute() {
    assert.equal(typeof this.path, 'string', 'expected view.path to be a string');
    return path.resolve(this.base, this.path);
  }

  /**
   * Get the relative path from `view.base`. This is automatically created
   * and cannot be directly set.
   */

  get relative() {
    assert.equal(typeof this.path, 'string', 'expected view.path to be a string');
    return path.relative(this.base, this.path);
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

  set engine(val) {
    this._engine = val;
  }
  get engine() {
    let engine = first([this.data.engine, this._engine, this.extname]);
    if (engine && engine[0] !== '.') {
      engine = '.' + engine;
    }
    return engine;
  }

  get isView() {
    return true;
  }

  get _isVinyl() {
    return true;
  }

  static isView(view) {
    return isObject(view) && (view.isView === true || view._isVinyl === true);
  }

  static isVinyl(file) {
    return this.isView(file);
  }

  static isBuiltIn(key) {
    const builtins = [
      '_base',
      '_contents',
      '_cwd',
      '_engine',
      '_isVinyl',
      '_key',
      '_layout',
      '_symlink',
      'absolute',
      'base',
      'cache',
      'constructor',
      'cwd',
      'hasPath',
      'history',
      'isBuffer',
      'isDirectory',
      'isNull',
      'isStream',
      'isSymbolic',
      'isSymbolicLink',
      'path',
      'pathEndsWith',
      'relative'
    ];
    return builtins.includes(key);
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
