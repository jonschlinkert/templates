const assert = require('assert');

module.exports = app => {
  // app.define('group', function(list = this.list, options = {}) {
  //   const { limit = 3 } = options;
  //   const items = list.slice();
  //   const pages = [];
  //   while (items.length) {
  //     pages.push(items.splice(0, limit));
  //   }
  //   return pages;
  // });

  app.define('group', function(prop, options = {}) {
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
  });

  app.define('collect', function(prop, options = {}, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    const obj = this.group(prop, options);
    const paths = [];
    const items = [];
    const keys = Object.keys(obj);
    const mapping = {};
    for (const key of keys) {
      const list = obj[key];
      this.paginate({ ...options, list }, (page, i) => {
        if (i === 0) {
          page.path = `/${prop}/${key}/index.html`;
        } else {
          page.path = `/${prop}/${key}/page/${i + 1}/index.html`;
        }

        if (fn) page = fn(page, key, i) || page;
        if (i === 0) {
          paths.push(page.path);
          mapping[key] = { path: page.path, list };
        }

        items.push(page);
        return page;
      });
    }
    return { items, paths, [prop]: mapping };
  });

  app.define('pager', function(options = {}) {
    const list = [];
    define(list, 'total', () => list.length);
    define(list, 'first', () => list[0]);
    define(list, 'last', () => list[list.length - 1]);
    let items = options.items || this.list;
    let index = 0;

    for (const page of items) {
      const data = { index, prev: index - 1, next: index + 1 };
      if (!page.data.pagination) page.data.pagination = {};
      Object.assign(page.data.pagination, data);
      list.push(page);
      index++;
    }
    return list;
  });

  app.define('paginate', function(options = {}, fn) {
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
      let page = {
        path: i === 0 ? 'index.html' : `page/${i + 1}/index.html`,
        data: { pagination: { items, index: i } }
      };
      if (fn) page = fn(page, i, arr) || page;
      arr.push(page);
    }

    return this.pager({ items: arr });
  });
};

function define(obj, key, value) {
  Reflect.defineProperty(obj, key, { value: value });
}
