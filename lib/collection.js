'use strict';

const assert = require('assert');
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
    super({ sync: true, ...options });
    this.isCollection = true;
    this.type = 'collection';
    this.name = name;
    this.list = [];
    this.fns = new Set();
  }

  use(plugin) {
    let fn = this.invoke(plugin).call(this, this);
    if (typeof fn === 'function') {
      fn.memo = fn.memo || new Set();
      this.fns.add(fn);
      for (const view of this.list) {
        if (fn.memo.has(view)) continue;
        fn.memo.add(view);
        fn.call(view, view);
      }
    }
    return this;
  }

  run(view, options) {
    for (const fn of this.fns) {
      fn.call(view, view, options);
    }
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

    this.run(view, { decorate: false });
    this.emit('view', view);
    this.views.set(view.key, view);

    const engine = view.engine;
    if (!view.engine && view.engine !== false && !this.engines.has(view.extname)) {
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
      this.list = this.list.filter(v => v !== view);
      this.views.delete(view.key);
      this.emit('delete', view);
      return this;
    }
  }

  group(prop, options = {}) {
    assert.equal(typeof prop, 'string', 'expected a string');
    const { list = this.list } = options;
    const obj = {};

    for (const item of list) {
      let arr = item.data[prop];

      if (typeof arr === 'string') {
        arr = arr.split(',');
      }

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

    const obj = this.group(prop, options);
    const items = [];
    const paths = {};
    const keys = Object.keys(obj);
    const mapping = {};
    for (const key of keys) {
      const list = obj[key];
      this.paginate({ ...options, list }, (page, i) => {
        page.data = page.data || {};
        page.data[options.singular || prop] = key;

        if (i === 0) {
          page.path = `${prop}/${key}/index.html`;
        } else {
          page.path = `${prop}/${key}/page/${i + 1}/index.html`;
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
    return { items, paths, [prop]: mapping };
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
   * @param {any} `val`
   * @return {boolean}
   * @api public
   */

  static isCollection(val) {
    return val && val.isCollection === true;
  }
}

function define(obj, key, value) {
  Reflect.defineProperty(obj, key, { value: value });
}

/**
 * Expose `Collection`
 */

module.exports = Collection;
