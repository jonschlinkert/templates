console.time('use');
const use = require('../lib/use');

/**
 * Plugins PoC
 */

class App {
  constructor() {
    this.type = 'app';
    this.collections = new Map();
    this.views = new Map();
    this.fns = new Set();
    // use(this);
  }

  use(plugin) {
    const fn = this.once(plugin).call(this, this);
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

  run(collection, options) {
    for (const fn of this.fns) {
      collection.use(fn);
    }
  }

  once(fn) {
    fn.once = fn.once || new Set();
    return function wrap(...args) {
      if (!wrap.called && !fn.once.has(this)) {
        fn.once.add(this);
        wrap.called = true;
        wrap.value = fn.call(this, ...args);
      }
      return wrap.value;
    };
  }
  collection(name, options) {
    const collection = new Collection(name, options);
    this.run(collection);
    return collection;
  }

  create(name, options) {
    const collection = this.collection(name, options);
    this[name] = collection.set.bind(collection);
    Object.setPrototypeOf(this[name], collection);
    this.views.set(name, collection.views);
    this.collections.set(name, collection);
    return this;
  }
}

class Collection {
  constructor() {
    this.type = 'collection';
    this.views = new Map();
    this.fns = new Set();
    // use(this);
  }

  use(plugin) {
    let fn = this.once(plugin).call(this, this);
    if (typeof fn === 'function') {
      fn.memo = fn.memo || new Set();
      this.fns.add(fn);
      for (const [key, view] of this.views) {
        if (fn.memo.has(view)) continue;
        fn.memo.add(view);
        fn.call(view, view);
      }
    }
    return this;
  }

  run(obj, options) {
    for (const plugin of this.fns) {
      const fn = this.once(plugin).call(obj, obj, options);
      if (obj.fns && typeof fn === 'function') {
        obj.fns.add(fn);
      }
    }
  }

  view(val) {
    const view = new View(val);
    this.run(view, { decorate: false });
    return view;
  }

  set(val) {
    const view = this.view(val);
    this.views.set(view.path, view);
    return this;
  }

  once(fn) {
    fn.once = fn.once || new Set();
    return function wrap(...args) {
      if (!wrap.called && !fn.once.has(this)) {
        fn.once.add(this);
        wrap.called = true;
        wrap.value = fn.call(this, ...args);
      }
      return wrap.value;
    };
  }
}

class View {
  constructor(view) {
    this.type = 'view';
    Object.assign(this, view);
  }
}


const types = [];

function before(app) {
  types.push('before:' + app.type);
  return before;
}

function before(app) {
  types.push('before:' + app.type);
  return function(...args) {
    return before.call(app, ...args);
  }
}

function after(app) {
  types.push('after:' + app.type);
  return function(...args) {
    return after.call(app, ...args);
  }
}

function other(app) {
  types.push('other:' + app.type);
  return function(...args) {
    return other.call(app, ...args);
  }
}
// function before(app) {
//   types.push('before:' + app.type);
//   return before;
// }

// function after(app) {
//   types.push('after:' + app.type);
//   return after;
// }

// function other(app) {
//   types.push('other:' + app.type);
//   return other;
// }

const app = new App();
app.use(before);
app.use(before);
app.use(before);
app.use(before);
app.use(before);
app.use(before);

app.create('pages');
app.pages.set({ path: 'home', contents: Buffer.from('this is the home page') });
app.pages.set({ path: 'home', contents: Buffer.from('this is the home page') });
app.pages.set({ path: 'home', contents: Buffer.from('this is the home page') });
app.pages.set({ path: 'home', contents: Buffer.from('this is the home page') });
app.pages.set({ path: 'home', contents: Buffer.from('this is the home page') });
app.pages.set({ path: 'home', contents: Buffer.from('this is the home page') });

app.use(other);
app.use(after);
app.use(after);
app.use(after);
app.use(after);
app.use(after);
app.use(after);

// console.log(app);
console.log(types, types.length);
console.timeEnd('use');

