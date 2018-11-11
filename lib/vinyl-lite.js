'use strict';

const assert = require('assert');
const path = require('path');
const util = require('util');
const { Stats } = require('fs');
const { isBuffer, isObject, isStream } = require('./utils');

/**
 * Create a new `File`.
 *
 * ```js
 * new File({ path: 'path/to/file.hbs' });
 * new File({ path: 'path/to/file.hbs', contents: Buffer.from('...') });
 * ```
 * @name File
 * @param {Object} `file`
 * @api public
 */

class File {
  constructor(file = {}) {
    assert(isObject(file), 'expected file to be an object');
    let normalize = this.constructor.normalize.bind(this.constructor);
    this.history = file.history ? file.history.map(normalize) : [];
    this.contents = file.contents || null;
    this.stat = file.stat || null;
    if (file.cwd) this.cwd = file.cwd;
    if (file.base) this.base = file.base;
    if (file.path) this.path = file.path;
    for (const key in file) {
      if (this.constructor.isCustomProp(key)) {
        this[key] = file[key];
      }
    }
  }

  [util.inspect.custom]() {
    let filepath = this.path && this.base ? `"${this.relative}"` : '';
    let inspect = [filepath.replace(/^"(?:\.\.\/)+volumes\/(\w+)/, '"$1:')];
    if (this.isBuffer()) inspect.push(this.contents.inspect());
    if (this.isStream()) inspect.push(inspectStream(this.contents));
    return `<File ${inspect.filter(Boolean).join(' ')}>`;
  }

  clone(options = {}) {
    if (typeof options === 'boolean') {
      options = { contents: options };
    }

    let history = this.history.slice();
    let file = new this.constructor(this);

    file.history = history;
    if (isObject(this.stat)) {
      file.stat = new Stats();
      for (let key of Object.keys(this.stat)) {
        file.stat[key] = this.stat[key];
      }
    }
    if (options.contents === false) {
      return file;
    }
    if (this.isBuffer()) {
      file.contents = Buffer.from(this.contents);
    }
    if (this.isStream()) {
      file.contents = this.contents.clone();
    }
    for (let key of Object.keys(this)) {
      if (key !== 'stat' && this.constructor.isCustomProp(key)) {
        file[key] = options.deep === false ? this[key] : clone(this[key]);
      }
    }
    return file;
  }

  /**
   * Returns true if `file.contents` is null.
   */

  isNull() {
    return this.contents === null;
  }

  /**
   * Returns true if `file.contents` is a buffer.
   */

  isBuffer() {
    return isBuffer(this.contents);
  }

  /**
   * Returns true if `file.contents` is a stream.
   */

  isStream() {
    return isStream(this.contents);
  }

  /**
   * Returns true if `file.path` is a directory.
   */

  isDirectory() {
    if (!this.isNull()) return false;
    if (this.stat && typeof this.stat.isDirectory === 'function') {
      return this.stat.isDirectory();
    }
    return false;
  }

  /**
   * Returns true if the file is symbolic link.
   */

  isSymbolicLink() {
    if (!this.isNull()) return false;
    if (this.stat && typeof this.stat.isSymbolicLink === 'function') {
      return this.stat.isSymbolicLink();
    }
    return false;
  }
  isSymbolic() {
    return this.isSymbolicLink();
  }

  /**
   * Returns true if `file.path` is absolute.
   */

  isAbsolute() {
    return path.isAbsolute(this.path);
  }

  /**
   * Get or set the current working directory. This is used for resolving
   * the absolute path for the file.
   */

  set cwd(val) {
    assert(isNonemptyString(val), 'file.cwd must be a non-empty string');
    this._cwd = this.constructor.normalize(val);
  }
  get cwd() {
    return this._cwd || process.cwd();
  }

  /**
   * Get or set the base path. This is used for creating the `file.relative` path.
   */

  set base(val) {
    if (val === null || val === void 0) {
      delete this._base;
      return;
    }

    assert(isNonemptyString(val), 'file.base must be a non-empty string, null, or undefined');

    let base = this.constructor.normalize(val);
    if (base === this._base) return;
    if (base === this._cwd) {
      delete this._base;
      return;
    }

    let filepath = this.history.length ? this.path : null;
    let relative = filepath ? this.relative : null;

    this._base = base;
    if (relative && filepath.indexOf(base) !== 0) {
      this.path = path.resolve(base, relative);
    }
  }
  get base() {
    return this._base || this.cwd;
  }

  /**
   * Get or set the `file.path` property.
   */

  set path(filepath) {
    if (filepath === '') return;
    assert.equal(typeof filepath, 'string', 'expected file.path to be a string');
    let val = this.constructor.normalize(filepath);
    if (val !== this.path) {
      this.history.push(val);
    }
  }
  get path() {
    return this.history[this.history.length - 1];
  }

  /**
   * Get the absolute `file.path`. This is automatically created and cannot
   * be directly set.
   */

  get absolute() {
    return path.resolve(this.path);
  }

  /**
   * Get or set `file.symlink`
   */

  set symlink(val) {
    assert.equal(typeof val, 'string', 'expected file.path to be a string');
    this._symlink = this.constructor.normalize(val);
  }
  get symlink() {
    return this._symlink || null;
  }

  /**
   * Get the relative path from `file.base`. This is automatically created
   * and cannot be directly set.
   */

  get relative() {
    return path.relative(this.base, this.path);
  }

  /**
   * Get or set the dirname of the `file.path`.
   */

  set dirname(dirname) {
    this.path = path.join(dirname, this.basename);
  }
  get dirname() {
    return path.dirname(this.path);
  }

  /**
   * Get or set the folder of the `file.path`. The "folder" is the last directory segment before the basename.
   */

  set folder(folder) {
    this.path = path.join(path.dirname(this.dirname), folder, this.basename);
  }
  get folder() {
    return path.basename(this.dirname);
  }

  /**
   * Get or set the basename of the `file.path`.
   */

  set basename(basename) {
    this.path = path.join(this.dirname, basename);
  }
  get basename() {
    return path.basename(this.path);
  }

  /**
   * Get or set the `stem` of the `file.path`.
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
   * Get or set the `extname` of the `file.path`.
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
   * Get or set `file.contents`. Must be a string, buffer, stream or null.
   */

  set contents(val) {
    if (val == null) {
      this._contents = this._originalContents = val;
      return;
    }
    if (!this.constructor.isValidContents(val)) {
      throw new TypeError('expected file.contents to be a buffer, stream, or null');
    }
    // Ask cloneable if the value is already a cloneable stream, to avoid
    // piping into many streams, thus reducing the overhead of cloning
    if (this.constructor.isReadable(val) && !this.constructor.isCloneable(val)) {
      val = new this.constructor.Cloneable(val);
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
   * Get the file size from `file.stat.size` or `file.contents.length`.
   * @param {String} `name`
   * @return {String}
   */

  set size(size) {
    throw new Error('file.size is a getter and may not be defined');
  }
  get size() {
    if (this.stat && typeof this.stat.size === 'number') {
      return this.stat.size;
    }
    if (this.isBuffer()) {
      return this.contents.length;
    }
    return 0;
  }

  get _isVinyl() {
    return true;
  }
  get _isFile() {
    return true;
  }

  static normalize(filepath) {
    if (typeof filepath !== 'string' || filepath === '') return '';
    let val = filepath.replace(/\\+/g, '/');
    while (val.length > 1 && val.endsWith('/')) {
      val = val.slice(0, -1);
    }
    return path.normalize(val);
  }
  static resolve(filepath) {
    return path.resolve(filepath);
  }

  /**
   * Returns true if the given file is a valid virtual file
   */

  static isFile(file) {
    return this.isVinyl(file) || (isObject(file) && file._isFile === true);
  }
  static isVinyl(file) {
    return isObject(file) && file._isVinyl === true;
  }

  /**
   * Returns true if `file.contents` is a cloneable-readable stream.
   */

  static isCloneable(val) {
    return isStream(val) && this.Cloneable.isCloneable(val);
  }
  static get Cloneable() {
    return require('./streams/cloneable');
  }
  static isReadable(val) {
    return isReadable(val);
  }

  /**
   * Returns true if the given value is valid for `file.contents`.
   */

  static isValidContents(val) {
    return val === null || isBuffer(val) || isStream(val);
  }
  static isCustomProp(key) {
    return !this.builtinProps.has(key);
  }

  static set builtinProps(props) {
    this._builtinProps = props;
  }
  static get builtinProps() {
    return this._builtinProps || new Set([
      '__proto__',
      '_base',
      '_contents',
      '_cwd',
      '_symlink',
      'absolute',
      'base',
      'constructor',
      'contents',
      'cwd',
      'fn',
      'history',
      'layoutFn',
      'layoutHistory',
      'path',
      'relative',
      'stat'
    ]);
  }
}

function clone(val) {
  let res = {};
  switch (typeof val) {
    case 'array':
      return val.map(clone);
    case 'object':
      if (isStream(val)) {
        return new File.Cloneable(val);
      }
      if (val === null) {
        return val;
      }
      for (let key of Object.keys(val)) {
        res[key] = clone(val[key]);
      }
      return res;
    default: {
      return val;
    }
  }
}

function isNonemptyString(val) {
  return typeof val === 'string' && val !== '';
}

function isReadable(val) {
  return isStream(val) && isObject(val._readableState);
}

function inspectStream(stream) {
  return `<${stream.constructor.name.replace('Stream', '')}Stream>`;
}

/**
 * Expose `File`
 */

module.exports = File;
