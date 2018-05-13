console.time('use');
const use = require('../lib/use');

class App {
  constructor() {
    this.type = 'app';
    this.collections = new Map();
    this.views = {};
    use(this);
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
    this.views[name] = collection.views;
    this.collections.set(name, collection);
    return this;
  }
}

class Collection {
  constructor() {
    this.type = 'collection';
    this.views = {};
    use(this);
  }
  view(val) {
    const view = new View(val);
    this.run(view, { decorate: false });
    return view;
  }
  set(val) {
    const view = this.view(val);
    this.views[view.path] = view;
    return this;
  }
}

class View {
  constructor(view) {
    this.type = 'view';
    Object.assign(this, view);
  }
}

const types = [];
// function before(app) {
//   types.push('before:' + app.type);
//   return function(...args) {
//     return before.call(app, ...args);
//   }
// }

// function after(app) {
//   types.push('after:' + app.type);
//   return function(...args) {
//     return after.call(app, ...args);
//   }
// }
function before(app) {
  types.push('before:' + app.type);
  return before;
}

function after(app) {
  types.push('after:' + app.type);
  return after;
}

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

app.use(after);
app.use(after);
app.use(after);
app.use(after);
app.use(after);
app.use(after);

// console.log(app);
// console.log(types, types.length);
console.timeEnd('use');
