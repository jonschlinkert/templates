'use strict';

const assert = require('assert');
const Collection = require('./lib/collection');
const Common = require('./lib/common');
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
    this.type = 'app';
    this.cache.partials = {};
    this.collections = new Map();
    this.viewCache = new Map();
    this.kinds = {};
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
    const collection = new Collection(name, options);
    this.run(collection);
    return collection;
  }

  /**
   * Create a cached view collection. When the collection emits a `view`, the view
   * is also cached on `app` to make lookups more performant.
   *
   * @param {String} `name` (required) Collection name
   * @param {Object} `options`
   * @return {Object} Returns the collection.
   * @api public
   */

  create(name, options) {
    const opts = { ...this.options, ...options };
    const collection = this.collection(name, opts);

    this.collections.set(name, collection);
    this.views.set(name, new Map());

    collection.once('error', this.emit.bind(this, 'error'));
    collection.on('delete', view => this.deleteView(name, view));
    collection.on('view', view => this.setView(name, view));

    const handle = collection.handle.bind(collection);
    collection.handle = (method, view) => {
      const res = super.handle(method, view);
      if (this.options.sync === true) return handle(method, view);
      return res.then(() => handle(method, view)).then(() => view);
    };

    if (opts.collectionMethod !== false) {
      this[name] = collection.set.bind(collection);
      Object.setPrototypeOf(this[name], collection);
    }

    this.emit('collection', collection);
    return collection;
  }

  /**
   *  Create a new `View`. Ensures `view` is emitted and plugins
   *  are run on the view.
   */

  view(...args) {
    const view = super.view(...args);
    this.run(view);
    this.emit('view', view);
    return view;
  }

  /**
   *  Add a view to collection `name`.
   */

  setView(name, view) {
    const kind = this.kind(view.kind);
    kind[view.key] = view;

    this.views.get(name).set(view.key, view);
    this.viewCache.set(view.path, view);
    this.emit('view', view);

    if (view.kind === 'partial') {
      const partials = this.cache.partials;
      if (this.options.enforceUniqueNames === true) {
        assert(!partials[view.key], new Error(`partial "${view.key}" already exists`));
      }
      define(partials, view.key, view);
    }
  }

  /**
   *  Delete a view from collection `name`.
   */

  deleteView(name, view) {
    const kind = this.kind(view.kind);
    delete kind[view.key];
    this.views.get(name).delete(view.key);
    this.viewCache.set(view.path, view);
    this.emit('delete', view);
  }

  /**
   * Get the object for a template "kind". Creates the object if it
   * doesn't already exist.
   *
   * @name .kind
   * @param {string} `name`
   * @return {object}
   * @api public
   */

  kind(name) {
    return this.kinds[name] || (this.kinds[name] = {});
  }

  /**
   * Handle middleware. This method is documented in the "Common" class.
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

function define(cache, key, view) {
  Reflect.defineProperty(cache, key, {
    enumerable: true,
    configurable: true,
    get() {
      return view.fn || view.contents.toString();
    }
  });
}

/**
 * Expose `Templates`
 */

module.exports = Templates;
