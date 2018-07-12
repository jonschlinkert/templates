const { Suite } = require('benchmark');
const argv = require('minimist')(process.argv.slice(2));
const cursor = require('ansi')(process.stdout);
const handlebars = require('handlebars');
const engine = require('../examples/support/engine');
const Templates = require('..');
const Collection = Templates.Collection;
const View = Templates.View;

const cycle = (e, nl) => {
  cursor.eraseLine();
  cursor.horizontalAbsolute();
  cursor.write('  ' + e.target);
  if (nl) cursor.write('\n');
};

function bench(name) {
  if (!argv[name]) {
    const res = {};
    res.add = () => res;
    res.run = () => res;
    return res;
  }

  console.log(`\n# ${name}`);
  const suite = new Suite();
  suite.on('complete', () => fastest(suite));

  const res = {
    run: suite.run.bind(suite),
    add: (key, fn) => {
      suite.add(key, {
        onCycle: e => cycle(e),
        onComplete: e => cycle(e, true),
        fn: fn
      });
      return res;
    }
  };
  return res;
}

function fastest(suite) {
  suite.on('complete', () => {
    const fastest = suite.filter('fastest').map('name').toString();
    const times = [];

    suite.forEach(ele => times.push(+ele.hz));
    times.sort();

    const best = times.pop();
    const avgTime = times.reduce((acc, n) => acc + n, 0) / times.length;
    const avg = ((best - avgTime) / avgTime) * 100;
    console.log(`fastest is '${color.italic(fastest)}' (by ${avg.toFixed()} % avg)`);
    console.log();
  });
}

/**
 * App
 */

bench('app')
  .add('no options', () => {
    new Templates();
  })
  .add('options', () => {
    new Templates({
      handlers: ['onLoad', 'preRender', 'postRender', 'preWrite', 'postWrite']
    });
  })
  .run();

/**
 * Collections
 */

bench('collection')
  .add('app.create()', () => {
    const app = new Templates();
    app.create('pages');
  })
  .add('app.create() with options', () => {
    const app = new Templates();
    app.create('layouts', { kind: 'layout' });
  })
  .add('new Collection()', () => {
    new Collection('pages');
  })
  .add('new Collection() with options', () => {
    new Collection('layouts', { kind: 'layout' });
  })
  .run();

/**
 * Views
 */

bench('view')
  // .add('app.view()', () => {
  //   const app = new Templates();
  //   app.view('foo', { path: 'foo/bar' });
  // })
  // .add('view from app.create() collection', () => {
  //   const app = new Templates();
  //   app.create('layouts', { kind: 'layout' });
  //   app.layouts('foo', { path: 'foo/bar' });
  // })
  .add('view from app.collection() collection', () => {
    const app = new Templates();
    const collection = app.collection('layouts', { kind: 'layout' });
    collection.view('foo', { path: 'foo/bar' });
  })
  .add('view cached on app.collection()', async() => {
    const app = new Templates();
    const collection = app.collection('layouts', { kind: 'layout' });
    await collection.set('foo', { path: 'foo/bar' });
  })
  .add('new View()', () => {
    new View({ path: 'foo/bar' });
  })
  .run({ async: true });

/**
 * Engines
 */

bench('engines')
  .add('app.engine()', () => {
    const app = new Templates();
    app.engine('hbs', engine(handlebars));
  })
  .add('collection.engine()', () => {
    const app = new Collection('pages');
    app.engine('hbs', engine(handlebars));
  })
  .run();

/**
 * Layouts
 */

let initialized = false;

app = new Templates({ asyncHelpers: false });
app.engine('hbs', engine(handlebars));

app.create('pages');
app.create('layouts', { kind: 'layout' });
app.layouts.set({ path: 'foo', contents: Buffer.from('before {% body %} after') });
app.layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'foo' });
app.layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after'), layout: 'base' });

const view = app.pages.set('foo', {
  contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

// console.log(app)

bench('layouts')
  // .add('collection.renderLayout()', () => {
  //   const collection = new Collection('layouts', { kind: 'layout '});
  //   collection.set({ path: 'default', contents: 'before {{name}} after' });
  //   const view = new View({ path: 'foo/bar', contents: 'before {{name}} after' });
  // })
  .add('collection.renderLayout()', async() => {

    // await app.render(view, { description: 'This is a page' });
    // console.log(view.contents.toString())

  })
  .run({ async: true });


// bench('rendering')
//   .add('app.render()', () => {
//     const app = new Templates();
//     const view = new View({ path: 'foo/bar', contents: 'before {{name}} after' });

//   })
//   .run();

// const app = new App({
//   handlers: [
//     'onLoad',
//     'preCompile',
//     'preLayout',
//     'preRender',
//     'postCompile',
//     'postLayout',
//     'postRender'
//   ],
// });

// const pages = app.create('pages');
// const layouts = app.create('layouts', { kind: 'layout' });
// layouts.set({ path: 'default.hbs', contents: Buffer.from('before {% body %} after') });

// app.engine('hbs', engine(handlebars));

