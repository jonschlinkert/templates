'use strict';

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
    this.views = new Map();
    this.kinds = {};
  }

  kind(name) {
    return this.kinds[name] || (this.kinds[name] = new Map());
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
    this.run(collection);

    this.collections.set(name, collection);
    this.views.set(name, new Map());

    collection.once('error', this.emit.bind(this, 'error'));
    collection.on('delete', view => this.deleteView(name, view));
    collection.on('view', view => this.setView(name, view));

    const handle = collection.handle.bind(collection);
    collection.handle = (method, view) => {
      return super.handle(method, view).then(() => handle(method, view));
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
    this.views.get(name).set(view.key, view);
    this.kind(view.kind).set(view.key, view);
    this.viewCache.set(view.path, view);
    this.emitState('view', 'added', { kind: view.kind });
    this.emit('view', view);

    if (view.kind === 'partial') {
      define(this.cache.partials, view);
    }
  }

  /**
   *  Delete a view from collection `name`.
   */

  deleteView(name, view) {
    this.views.get(name).delete(view.key);
    this.viewCache.set(view.path, view);
    if (this.kinds[view.kind]) {
      this.kinds[view.kind].delete(view);
    }
    this.emitState('view', 'deleted');
    this.emit('delete', view);
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

function define(cache, view) {
  Reflect.defineProperty(cache, view.key, {
    enumerable: true,
    configurable: true,
    get() {
      // console.log(view.fn)
      return view.fn || view.contents.toString();
    }
  });
}

/**
 * Expose `Templates`
 */

module.exports = Templates;
