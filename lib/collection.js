'use strict';

const Common = require('./common');

/**
 * Create a new `Collection` with the given `options`.
 *
 * ```js
 * const collection = new Collection();
 * ```
 * @name Collection
 * @extends {Class} Common
 * @param {string} `name` (required) Collection name
 * @param {object} `options`
 * @api public
 */

class Collection extends Common {
  constructor(name, options) {
    if (typeof name !== 'string') {
      options = name;
      name = null;
    }
    super(options);
    this.isCollection = true;
    this.type = 'collection';
    this.name = name;
    this.views = new Map();
  }

  /**
   * Add a view to `collection.views`.
   *
   * ```js
   * collection.set('foo/bar.html', { contents: Buffer.from('...') });
   * collection.set({ path: 'foo/bar.html', contents: Buffer.from('...') });
   * ```
   * @name .set
   * @param {string|object} `key`
   * @param {object|undefined} `val`
   * @return {object} Returns the view.
   * @api public
   */

  set(key, val) {
    const view = this.view(key, val);
    view.key = this.renameKey(view);
    this.run(view);
    this.emit('view', view);
    this.views.set(view.key, view);

    const res = this.handle('onLoad', view);
    if (this.options.sync !== true) {
      return res.then(() => view);
    }
    return view;
  }

  /**
   * Get a view from `collection.views`.
   *
   * ```js
   * collection.get('foo/bar.html');
   * collection.get('foo.html');
   * collection.get('foo');
   * ```
   * @name .get
   * @param {string|RegExp|Function} `key`
   * @return {object} Returns the view if found.
   * @api public
   */

  get(key) {
    if (this.View.isView(key)) return key;
    if (this.views.has(key)) return this.views.get(key);
    return this.find(view => view.hasPath(key));
  }

  /**
   * Find a view on `collection.views` with the given `fn`.
   *
   * ```js
   * const view = collection.find(view => view.basename === 'foo.hbs');
   * ```
   * @name .find
   * @param {object} `view`
   * @return {object} Returns the view, if found.
   * @api public
   */

  find(fn) {
    for (const [key, view] of this.views) {
      if (fn(view, key) === true) {
        return view;
      }
    }
  }

  /**
   * Remove `view` from `collection.views`.
   *
   * ```js
   * collection.delete(view);
   * collection.delete('/foo/bar.hbs');
   * ```
   * @name .delete
   * @param {object|string} `view`
   * @return {object} Returns the removed view.
   * @api public
   */

  delete(val) {
    const view = this.get(val);
    if (view && view.collection === this) {
      view.collection = null;
      this.views.delete(view.key);
      this.emit('delete', view);
      return this;
    }
  }

  /**
   * Get or set the collection kind.
   */

  set kind(val) {
    this.options.kind = val;
  }
  get kind() {
    return this.options.kind || 'renderable';
  }

  /**
   * Static method that returns true if the given value is a collection instance.
   * @param {any} `val`
   * @return {boolean}
   * @api public
   */

  static isCollection(val) {
    return val && val.isCollection === true;
  }
}

/**
 * Expose `Collection`
 */

module.exports = Collection;
