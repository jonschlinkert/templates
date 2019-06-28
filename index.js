'use strict';

const assert = require('assert');
const Base = require('./lib/base');
const streams = require('./lib/streams');
const utils = require('./lib/utils');

/**
 * Create an instance of `Templates` with the given [options](#options).
 *
 * ```js
 * const app = new Templates(options);
 * ```
 * @name Templates
 * @extends {Class} Base
 * @param {Object} `options`
 * @api public
 */

class Templates extends Base {
  constructor(options) {
    super(options);
    let Collection = this.constructor.Collection;
    this.Collection = this.options.Collection || Collection;
    this.cache.partials = {};
    this.collections = new Map();
    this.fileCache = new Map();
    this.type = this.options.defaultCollectionType || 'renderable';
    this.lists = {};
    this.types = {};
  }

  toStream(...args) {
    return streams.app(this, ...args);
  }

  /**
   *  Cache files when created by a collection. This makes lookups
   *  much faster, and allows us avoid costly merging at render time.
   */

  set(collectionName, file) {
    let type = this.getType(file.type);
    type[file.key] = file;

    this.files.get(collectionName).set(file.key, file);
    this.fileCache.set(file.path, file);
    this.emit('file', file);

    if (file.type === 'partial') {
      let partials = this.cache.partials;
      if (this.options.enforceUniquePartialNames === true) {
        assert(!partials[file.key], new Error(`partial "${file.key}" already exists`));
      }
      define(partials, file.key, file);
    }

    if (file.type === 'renderable') {
      this.lists[collectionName] = this.lists[collectionName] || [];
      this.lists[collectionName].push(file);
    }
  }

  /**
   * Get a cached file.
   *
   * ```js
   * // get a file from the collection passed as the last argument
   * console.log(app.get('foo/bar.html', 'pages'));
   * console.log(app.get('foo.html', 'pages'));
   *
   * // or get the first matching file from any registered collection
   * console.log(app.get('foo/bar.html'));
   * console.log(app.get('foo.html'));
   * ```
   * @name .get
   * @param {String|RegExp|Function} `key`
   * @return {Object} Returns the file if found.
   * @api public
   */

  get(key, collectionName) {
    if (this.constructor.File.isFile(key)) return key;
    if (collectionName) return this[collectionName].get(key);
    if (this.fileCache.has(key)) return this.fileCache.get(key);
    return this.find(file => file.hasPath(key));
  }

  /**
   *  Delete a file from collection `name`.
   */

  delete(collectionName, file) {
    let type = this.getType(file.type);
    delete type[file.key];
    this.files.get(collectionName).delete(file.key);
    this.fileCache.delete(file.path);
    this.lists[collectionName] = this.lists[collectionName].filter(v => v !== file);
    this.emit('delete', file);
  }

  /**
   * Get a cached file.
   *
   * ```js
   * // iterates over all collections
   * app.get('foo/bar.html');
   * app.get('foo.html');
   *
   * // or specify the collection name
   * app.get('foo/bar.html', 'pages');
   * app.get('foo.html', 'pages');
   * ```
   * @name .get
   * @param {String|RegExp|Function} `key`
   * @param {String} `collectionName` Optionally provide a collection name.
   * @return {Object} Returns the file if found.
   * @api public
   */

  has(key, collectionName) {
    return this.get(key, collectionName) !== void 0;
  }

  /**
   * Find a cached file with the given `fn`.
   *
   * ```js
   * const file = app.find(file => file.basename === 'foo.hbs');
   * ```
   * @name .find
   * @param {Object} `file`
   * @return {Object} Returns the file, if found.
   * @api public
   */

  find(fn) {
    for (const [key, file] of this.fileCache) {
      if (fn(file, key) === true) {
        return file;
      }
    }
  }

  /**
   * Creates and returns an un-cached collection.
   * @param {String} `name` (required) Collection name
   * @param {Object} `options`
   * @return {Object} Returns the collection.
   * @api public
   */

  collection(name, options) {
    let collection = new this.Collection(name, options);
    this.emit('collection', collection);
    this.run(collection);
    return collection;
  }

  /**
   * Create a file collection. When the collection emits a `file`, the file
   * is also cached on `app` to make lookups more performant.
   *
   * @param {String} `name` (required) Collection name
   * @param {Object} `options`
   * @return {Object} Returns the collection.
   * @api public
   */

  create(name, options) {
    let ctorName = this.constructor.name;
    assert(!(name in this), `Collection name "${name}" cannot be used as it conflicts with an existing property on the ${ctorName} instance. Please choose another collection name.`);

    let opts = { ...this.options, ...options };
    let collection = this.collection(name, opts);

    // add the collection to app.collections
    this.collections.set(name, collection);

    // initialize a Map for caching collection.files
    this.files.set(name, new Map());

    // listen for events on the collection
    collection.once('error', err => this.emit('error', err));
    collection.on('delete', file => this.delete(name, file));
    collection.on('file', file => this.set(name, file));

    // override collection properties for engines and helpers
    collection.helpers = this.helpers;
    collection.engine = this.engine.bind(this);
    collection.helper = this.helper.bind(this);

    const handle = collection.handle.bind(collection);

    collection.handle = (method, file) => {
      if (this.options.sync === true) {
        super.handle(method, file);
        handle(method, file);
        return file;
      }

      return Promise.resolve(super.handle(method, file))
        .then(() => handle(method, file))
        .then(() => file);
    };

    if (opts.collectionMethod !== false) {
      let method = collection.set.bind(collection);
      Object.setPrototypeOf(method, collection);
      Reflect.defineProperty(this, name, { value: method });
    } else {
      this[name] = collection;
    }

    return collection;
  }

  /**
   * Get collection of the given `type`. If the _type_ doesn't
   * already exist, it will be created and an empty object will be returned.
   *
   * @name .getType
   * @param {string} `name`
   * @return {object}
   * @api public
   */

  getType(name) {
    return this.types[name] || (this.types[name] = {});
  }

  /**
   * Handle middleware. This method is documented in the "Base" class.
   */

  handle(method, file) {
    if (file.collection) {
      return file.collection.handle(method, file);
    }
    return super.handle(method, file);
  }

  /**
   * Expose constructors and convenience methods as static properties
   */

  static get Cloneable() {
    return require('./lib/streams/cloneable');
  }
  static get Collection() {
    return require('./lib/collection');
  }
  static get File() {
    return require('./lib/file');
  }
  static get resolve() {
    return require('./lib/resolve');
  }
}

function define(cache, key, file) {
  Reflect.defineProperty(cache, key, {
    enumerable: true,
    configurable: true,
    get() {
      return file.fn || file.contents.toString();
    }
  });
}

/**
 * Expose `Templates`
 */

module.exports = Templates;
