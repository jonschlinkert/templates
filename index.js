'use strict';

const assert = require('assert');
const streams = require('./lib/streams');
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
    this.Collection = this.options.Collection || Collection;
    this.collections = new Map();
    this.viewCache = new Map();
    this.cache.partials = {};
    this.lists = {};
    this.kinds = {};
    this.fns = new Set();

    if (this.options.streams === true) {
      this.use(streams(options));
    }
  }

  use(plugin) {
    const fn = this.invokeOnce(plugin).call(this, this);
    if (typeof fn === 'function') {
      fn.memo = fn.memo || new Set();
      for (const [key, collection] of this.collections) {
        if (fn.memo.has(collection)) continue;
        fn.memo.add(collection);
        collection.use(fn);
      }
      this.fns.add(fn);
    }
    return this;
  }

  run(obj, options) {
    for (const fn of this.fns) {
      if (obj.use) {
        obj.use(fn, options); // collection
      } else {
        fn.call(obj, obj, options); // view
      }
    }
  }

  /**
   *  Cache views when created by a collection. This makes lookups
   *  much faster, and allows us avoid costly merging at render time.
   */

  set(collectionName, view) {
    const kind = this.kind(view.kind);
    kind[view.key] = view;

    this.views.get(collectionName).set(view.key, view);
    this.viewCache.set(view.path, view);
    this.emit('view', view);

    if (view.kind === 'partial') {
      const partials = this.cache.partials;
      if (this.options.enforceUniqueNames === true) {
        assert(!partials[view.key], new Error(`partial "${view.key}" already exists`));
      }
      define(partials, view.key, view);
    }

    if (view.kind === 'renderable') {
      this.lists[collectionName] = this.lists[collectionName] || [];
      this.lists[collectionName].push(view);
    }
  }

  /**
   * Get a cached view.
   *
   * ```js
   * // get a view from the collection passed as the last argument
   * console.log(app.get('foo/bar.html', 'pages'));
   * console.log(app.get('foo.html', 'pages'));
   *
   * // or get the first matching view from any registered collection
   * console.log(app.get('foo/bar.html'));
   * console.log(app.get('foo.html'));
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
   *  Delete a view from collection `name`.
   */

  delete(collectionName, view) {
    const kind = this.kind(view.kind);
    delete kind[view.key];
    this.views.get(collectionName).delete(view.key);
    this.viewCache.delete(view.path);
    this.lists[collectionName] = this.lists[collectionName].filter(v => v !== view);
    this.emit('delete', view);
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

  has(key, collectionName) {
    return !!this.get(key, collectionName);
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
   * Create an un-cached collection.
   * @param {String} `name` (required) Collection name
   * @param {Object} `options`
   * @return {Object} Returns the collection.
   * @api public
   */

  collection(name, options) {
    const collection = new this.Collection(name, options);
    this.emit('collection', collection);
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

    collection.once('error', err => this.emit('error', err));
    collection.on('delete', view => this.delete(name, view));
    collection.on('view', view => this.set(name, view));

    const handle = collection.handle.bind(collection);
    collection.handle = (method, view) => {
      if (this.options.sync === true) {
        super.handle(method, view);
        handle(method, view);
        return view;
      }
      return super.handle(method, view)
        .then(() => handle(method, view))
        .then(() => view);
    };

    if (opts.collectionMethod !== false) {
      this[name] = collection;
    }

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
   * Get a "kind" of template. If the _kind_ doesn't already exist, it
   * will be created and an empty object will be returned.
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
