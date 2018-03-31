'use strict';

const Common = require('./lib/common');
const Collection = require('./lib/collection');
const View = require('./lib/view');

/**
 * Create an instance of `Templates` with the given [options](#options).
 *
 * ```js
 * const app = new Templates(options);
 * ```
 * @name Templates
 * @extends {Class} Common
 * @param {Object} `options`
 * @api public
 */

class Templates extends Common {
  constructor(options) {
    super(options);
    this.viewCache = new Map();
    this.collections = {};
    this.types = {};
  }

  /**
   * Get a cached view.
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
   * @return {Object} Returns the view if found.
   * @api public
   */

  get(key, collectionName) {
    if (View.isView(key)) return key;
    if (collectionName) return this[collectionName].get(key);
    if (this.viewCache.has(key)) return this.viewCache.get(key);
    return this.find(view => view.hasPath(key));
  }

  /**
   * Find a cached view with the given `fn`.
   *
   * ```js
   * const view = app.find(view => view.basename === 'foo.hbs');
   * ```
   * @name .find
   * @param {Object} `view`
   * @return {Object} Returns the view, if found.
   * @api public
   */

  find(fn) {
    for (const [key, view] of this.viewCache) {
      if (fn(view, key) === true) {
        return view;
      }
    }
  }

  /**
   * Create an un-cached view collection.
   * @param {String} `name` (required) Collection name
   * @param {Object} `options`
   * @return {Object} Returns the collection.
   * @api public
   */

  collection(name, options) {
    return new Collection(name, options);
  }

  /**
   * Create a cached view collection.
   * @param {String} `name` (required) Collection name
   * @param {Object} `options`
   * @return {Object} Returns the collection.
   * @api public
   */

  create(name, options) {
    const opts = { ...this.options, ...options };
    const collection = this.collection(name, opts);
    this.collections[name] = collection;

    collection.on('error', this.emit.bind(this, 'error'));
    collection.on('view', view => {
      this.types[view.type] = this.types[view.type] || {};
      this.types[view.type][view.key] = view;
      this.viewCache.set(view.path, view);
      this.emit('view', view);
    });

    const handle = collection.handle.bind(collection);
    collection.handle = (method, view) => {
      return super.handle(method, view).then(() => handle(method, view));
    };

    if (opts.collectionMethod !== false) {
      this[name] = collection.set;
    }

    this.emit('collection', name, collection);
    return collection;
  }

  /**
   * Handle middleware
   */

  handle(method, view) {
    if (view.collection) {
      return view.collection.handle(method, view);
    }
    return super.handle(method, view);
  }

  /**
   * Expose constructors as static properties
   */

  static get Collection() {
    return Collection;
  }
  static get View() {
    return View;
  }
}

/**
 * Expose `Templates`
 */

module.exports = Templates;
