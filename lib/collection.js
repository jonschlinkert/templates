'use strict';

const assert = require('assert');
const Common = require('./common');
const streams = require('./streams');
const { set, get } = require('./utils');

/**
 * Create a new `Collection` with the given `options`.
 *
 * ```js
 * const collection = new Collection();
 * ```
 * @name Collection
 * @extends {Class} Common
 * @param {String} `name` (required) Collection name
 * @param {Object} `options`
 * @api public
 */

class Collection extends Common {
  constructor(name, options) {
    if (typeof name !== 'string') {
      options = name;
      name = null;
    }
    super({ sync: true, ...options });
    this.isCollection = true;
    this.name = name;
    this.list = [];
    this.use(streams(options));
  }

  /**
   * Add a view to `collection.views`.
   *
   * ```js
   * collection.set('foo/bar.html', { contents: Buffer.from('...') });
   * collection.set({ path: 'foo/bar.html', contents: Buffer.from('...') });
   * ```
   * @name .set
   * @param {String|object} `key`
   * @param {Object|undefined} `val`
   * @return {Object} Returns the view.
   * @api public
   */

  set(key, val) {
    const view = this.view(key, val);

    this.run(view, { decorate: false });
    this.emit('view', view);
    this.views.set(view.key, view);

    const { engine, extname } = view;
    if (!engine && engine !== false && !this.engines.has(extname)) {
      view.engine = this.options.engine;
    }

    this.handle('onLoad', view);
    this.list.push(view);
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
   * @param {String|RegExp|Function} `key`
   * @return {Object} Returns the view if found.
   * @api public
   */

  get(key) {
    if (this.View.isView(key)) return key;
    if (this.views.has(key)) return this.views.get(key);
    return this.find(view => view.hasPath(key));
  }

  /**
   * Returns true if the collection has the given view.
   *
   * ```js
   * // check by path
   * collection.has('foo/bar.html');
   * collection.has('foo.html');
   * collection.has('foo');
   *
   * // regex
   * collection.has(/bar\.html$/);
   *
   * // function
   * collection.has(view => view.basename === 'foo.html');
   * ```
   * @name .has
   * @param {String|RegExp|Function} `key`
   * @return {Boolean} Returns true if the view exists.
   * @api public
   */

  has(key) {
    return !!this.get(key);
  }

  /**
   * Find a view on `collection.views` with the given `fn`.
   *
   * ```js
   * const view = collection.find(view => view.basename === 'foo.hbs');
   * ```
   * @name .find
   * @param {Object} `view`
   * @return {Object} Returns the view, if found.
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
   * @param {Object|string} `view`
   * @return {Object} Returns the removed view.
   * @api public
   */

  delete(val) {
    const view = this.get(val);
    if (view && view.collection === this) {
      view.collection = null;
      this.list = this.list.filter(v => v !== view);
      this.views.delete(view.key);
      this.emit('delete', view);
      return this;
    }
  }

  /**
   * Returns a new object with views in the collection grouped by the given `prop`.
   *
   * ```js
   * console.log(posts.groupBy('data.tags'));
   * console.log(posts.groupBy('extname'));
   * console.log(posts.groupBy('stem'));
   * console.log(posts.groupBy(view => view.data.tags));
   * ```
   * @param {String|Function} `prop` Object path or function that returns the value
   * to group by.
   * @param {Object} `options`
   * @return {Object}
   * @api public
   */

  groupBy(prop, options = {}) {
    const { list = this.list } = options;
    const obj = {};

    for (const item of list) {
      let arr = typeof prop === 'function' ? prop(item) : get(item, prop);

      if (typeof arr === 'string') {
        arr = arr.split(',');
      }

      if (!arr) continue;
      for (const val of arr) {
        if (typeof val !== 'string') continue;
        const key = val.trim();
        obj[key] = obj[key] || [];
        obj[key].push(item);
      }
    }
    return obj;
  }

  collect(prop, options = {}, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    const name = prop.split('.').pop();
    const foo = options.singular || prop;
    const obj = this.groupBy(prop, options);
    const keys = Object.keys(obj);
    const mapping = {};
    const items = [];
    const paths = {};

    for (const key of keys) {
      const list = obj[key];
      this.paginate({ ...options, list }, (page, i) => {
        set(page, foo, key);

        if (i === 0) {
          page.path = `${name}/${key}/index.html`;
        } else {
          page.path = `${name}/${key}/page/${i + 1}/index.html`;
        }

        if (fn) page = fn(page, key, i) || page;
        if (i === 0) {
          paths[key] = page.path;
          mapping[key] = { path: page.path, list };
        }

        items.push(page);
        return page;
      });
    }

    const res = { items, paths, [name]: mapping };
    // set(res, prop, mapping);
    return res;
  }

  pager(options = {}) {
    const list = [];
    define(list, 'total', () => list.length);
    define(list, 'first', () => list[0]);
    define(list, 'last', () => list[list.length - 1]);
    let items = (options.items || this.list).slice();
    let number = 1;
    let index = 0;

    if (options.sort) {
      items = options.sort(items);
    }

    for (const page of items) {
      const data = {
        items,
        index,
        number,
        first: {
          index: 0,
          number: 1
        },
        prev: {
          index: index === 0 ? null : index - 1,
          number: number === 1 ? null : number - 1
        },
        next: {
          index: index === items.length - 1 ? null : index + 1,
          number: number === items.length ? null : number + 1
        },
        last: {
          index: items.length - 1,
          number: items.length
        }
      };

      if (!page.data.pager) page.data.pager = {};
      Object.assign(page.data.pager, data);
      this.handle('onPager', page);
      list.push(page);
      number++;
      index++;
    }

    return list;
  }

  paginate(options = {}, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    let { perPage = 10, list = this.list } = options;
    let total = Math.ceil(list.length / perPage);
    const arr = [];

    for (let i = 0; i < total; i++) {
      const start = i * perPage;
      const end = start + perPage;
      const items = list.slice(start, end);
      const number = i + 1;

      let page = this.view({
        path: i === 0 ? 'index.html' : `page/${number}/index.html`,
        data: { pagination: { items, index: i, number, total } }
      });

      this.handle('onPaginate', page);
      if (fn) page = fn(page, i, arr) || page;
      arr.push(page);
    }

    return this.pager({ items: arr });
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
   * @param {Any} `val`
   * @return {Boolean}
   * @api public
   */

  static isCollection(val) {
    return val && val.isCollection === true;
  }
}

function define(obj, key, value) {
  Reflect.defineProperty(obj, key, { value });
}

/**
 * Expose `Collection`
 */

module.exports = Collection;
