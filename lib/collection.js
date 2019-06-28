'use strict';

const Base = require('./base');
const streams = require('./streams');
const { set, get, define } = require('./utils');

/**
 * Create a new `Collection` with the given `options`.
 *
 * ```js
 * const collection = new Collection();
 * ```
 * @name Collection
 * @extends {Class} Base
 * @param {String} `name` (required) Collection name
 * @param {Object} `options`
 * @api public
 */

class Collection extends Base {
  constructor(name, options) {
    if (typeof name !== 'string') {
      options = name;
      name = void 0;
    }
    super(options);
    this.name = name;
    this.list = [];
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
    let file = this.file(key, val);
    this.files.set(file.key, file);
    this.list.push(file);

    let setEngine = () => {
      let fallback = this.options.engine || this.engines.get('*');
      let { engine, extname } = file;
      if (engine === void 0 || (engine === extname && !this.engines.has(extname))) {
        file.engine = fallback;
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
    for (let [key, file] of this.files) {
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
    let file = this.get(val);
    if (file && file.collection === this) {
      file.collection = void 0;
      this.list = this.list.filter(v => v !== file);
      this.files.delete(file.key);
      this.emit('delete', file);
      return this;
    }
  }

  /**
   * Push the collection into a through stream.
   */

  toStream(...args) {
    return streams.collection(this, ...args);
  }

  /**
   * Returns an object with files in the collection grouped by the
   * given `prop` from `file.data`.
   *
   * ```js
   * console.log(posts.groupBy('data.tags'));
   * console.log(posts.groupBy('extname'));
   * console.log(posts.groupBy('stem'));
   * console.log(posts.groupBy(file => file.data.tags));
   * ```
   * @name .groupBy
   * @param {String|Function} `prop` Object path or function that returns the value to group by.
   * @param {Array} `list` The list of files to group. If not defined, `collection.list` is used.
   * @return {Object} Grouped files.
   * @api public
   */

  groupBy(prop, files = this.list) {
    let groups = {};

    for (let file of files) {
      let arr = typeof prop === 'function' ? prop(file) : get(file, prop);

      if (typeof arr === 'string') {
        arr = arr.split(',');
      }

      if (!Array.isArray(arr)) continue;
      for (let val of arr) {
        if (typeof val !== 'string') continue;
        let key = val.trim();
        groups[key] = groups[key] || [];
        groups[key].push(file);
      }
    }
    return groups;
  }

  /**
   * Create a collection from a property in front-matter.
   *
   * ```js
   * console.log(posts.collect('data.tags'));
   * console.log(posts.collect('extname'));
   * console.log(posts.collect('stem'));
   * console.log(posts.collect(file => file.data.tags));
   * ```
   * @name .collect
   * @param {String|Function} `prop` Object path or function that returns the value to group by.
   * @param {Array} `list` The list of files to group. If not defined, `collection.list` is used.
   * @return {Object} Grouped files.
   * @api public
   */

  collect(prop, options = {}, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    let name = prop.split('.').pop();
    let path = options.singular || prop;
    let groups = this.groupBy(prop, options.list);
    let keys = Object.keys(groups);
    let mapping = {};
    let items = [];
    let paths = {};

    for (let key of keys) {
      let list = groups[key];
      this.paginate({ ...options, list }, (page, i) => {
        set(page, path, key);

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

    let res = { items, paths, [name]: mapping };
    // set(res, prop, mapping);
    return res;
  }

  /**
   * Create an array of paged items that may be passed on the context to
   * render prev/next paging elements.
   *
   * ```js
   * console.log(posts.pager(options));
   * ```
   * @name .pager
   * @param {Object} `options`
   * @return {Promise} Returns a promise with array of paged items.
   * @api public
   */

  async pager(options = {}) {
    let items = (options.items || this.list).slice();
    let number = 1;
    let index = 0;
    let list = [];

    if (options.sort) {
      items = options.sort(items);
    }

    for (let page of items) {
      let data = {
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
      await this.handle('onPager', page);
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

  /**
   * Paginate the collection or an array of items passed on `options.list`.
   * Creates `index` pages, and adds paging to each paginated page.
   *
   * ```js
   * console.log(posts.paginate(options, page => page));
   * ```
   * @name .paginate
   * @param {Object} `paginate`
   * @param {Function} `fn` Optionally pass a function to modify each paginated page.
   * @return {Array} Array of paginated/paged items.
   * @api public
   */

  async paginate(options = {}, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    let { perPage = 10, list = this.list } = options;
    let total = Math.ceil(list.length / perPage);
    let arr = [];

    for (let i = 0; i < total; i++) {
      let start = i * perPage;
      let end = start + perPage;
      let items = list.slice(start, end);
      let number = i + 1;

      let page = this.file({
        path: i === 0 ? 'index.html' : `page/${number}/index.html`,
        data: { pagination: { items, index: i, number, total } }
      });

      if (fn) page = fn(page, i, arr) || page;
      await this.handle('onPaginate', page);
      arr.push(page);
    }

    return this.pager({ items: arr });
  }

  /**
   * Getter/setter for getting or setting the `collection.type` property.
   * The collection type determines how a file is handled during the render
   * cycle. By default, the `collection.type` is set to `asset`, which means
   * that the file is "generic" and should be ignored by the render cycle.
   *
   * If the type is `renderable`, the file will be handled as a template
   * to be rendered by the designated template engine.
   *
   * If the type is `partial`, at render time the file will be registered
   * as a partial so that it can be used in other templates.
   *
   * If the type is
   * `layout`, the file will be registered as a layout, so that it can be used
   * by other templates as a layout at render time.
   *
   * @name .type
   * @return {String} Returns the collection type. The default value is `asset`.
   * @api public
   */

  set type(val) {
    this.options.type = val;
  }
  get type() {
    return this.options.type || 'renderable';
  }

  /**
   * Getter that returns true. Useful for validating that this is a
   * collection instance.
   * @name .isCollection
   * @return {Boolean}
   * @api public
   */

  get isCollection() {
    return true;
  }

  /**
   * Static method that returns true if the given value is a collection instance.
   * @name .isCollection
   * @param {any} `value`
   * @return {Boolean}
   * @api public
   */

  static isCollection(value) {
    return value && value.isCollection === true;
  }
}

/**
 * Expose `Collection`
 */

module.exports = Collection;
