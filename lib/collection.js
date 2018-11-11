'use strict';

const Common = require('./common');
const streams = require('./streams');
const { set, get, define } = require('./utils');

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
      name = void 0;
    }
    super({ ...options });
    this.name = name;
    this.list = [];
    this.fns = new Set();
    this.use(streams(options));
  }

  use(plugin) {
    let fn = this.invokeOnce(plugin).call(this, this);
    if (typeof fn === 'function') {
      fn.memo = fn.memo || new Set();
      this.fns.add(fn);
      for (const file of this.list) {
        if (fn.memo.has(file)) continue;
        fn.memo.add(file);
        fn.call(file, file);
      }
    }
    return this;
  }

  run(file, options) {
    for (const fn of this.fns) {
      fn.call(file, file, options);
    }
  }

  /**
   * Add a file to `collection.files`.
   *
   * ```js
   * collection.set('foo/bar.html', { contents: Buffer.from('...') });
   * collection.set({ path: 'foo/bar.html', contents: Buffer.from('...') });
   * ```
   * @name .set
   * @param {String|object} `key`
   * @param {Object|undefined} `val`
   * @return {Object} Returns the file.
   * @api public
   */

  set(key, val) {
    const file = this.file(key, val);

    this.run(file, { decorate: false });
    this.emit('file', file);
    this.files.set(file.key, file);
    this.list.push(file);

    const setEngine = () => {
      if (file.engine === void 0 && !this.engines.has(file.extname)) {
        file.engine = this.options.engine;
      }
      return file;
    };

    if (this.options.sync !== true) {
      return this.handle('onLoad', file).then(() => setEngine(file));
    }

    this.handle('onLoad', file);
    return setEngine(file);
  }

  /**
   * Get a file from `collection.files`.
   *
   * ```js
   * collection.get('foo/bar.html');
   * collection.get('foo.html');
   * collection.get('foo');
   * ```
   * @name .get
   * @param {String|RegExp|Function} `key`
   * @return {Object} Returns the file if found.
   * @api public
   */

  get(key) {
    if (this.File.isFile(key)) return key;
    if (this.files.has(key)) return this.files.get(key);
    return this.find(file => file.hasPath(key));
  }

  /**
   * Find a file on `collection.files` with the given `fn`.
   *
   * ```js
   * const file = collection.find(file => file.basename === 'foo.hbs');
   * ```
   * @name .find
   * @param {Object} `file`
   * @return {Object} Returns the file, if found.
   * @api public
   */

  find(fn) {
    for (const [key, file] of this.files) {
      if (fn(file, key) === true) {
        return file;
      }
    }
  }

  /**
   * Remove `file` from `collection.files`.
   *
   * ```js
   * collection.delete(file);
   * collection.delete('/foo/bar.hbs');
   * ```
   * @name .delete
   * @param {Object|string} `file`
   * @return {Object} Returns the removed file.
   * @api public
   */

  delete(val) {
    const file = this.get(val);
    if (file && file.collection === this) {
      file.collection = void 0;
      this.list = this.list.filter(v => v !== file);
      this.files.delete(file.key);
      this.emit('delete', file);
      return this;
    }
  }

  /**
   * Returns a new object with files in the collection grouped by the given `prop`.
   *
   * ```js
   * console.log(posts.groupBy('data.tags'));
   * console.log(posts.groupBy('extname'));
   * console.log(posts.groupBy('stem'));
   * console.log(posts.groupBy(file => file.data.tags));
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
        current: {
          index,
          number
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

    define(list, 'first', () => list[0]);
    define(list, 'prev', file => list[list.indexOf(file) - 1]);
    define(list, 'next', file => list[list.indexOf(file) + 1]);
    define(list, 'last', () => list[list.length - 1]);
    define(list, 'total', () => list.length);
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

      let page = this.file({
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

  get isCollection() {
    return true;
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

/**
 * Expose `Collection`
 */

module.exports = Collection;
