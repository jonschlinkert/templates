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

(async function() {

const app = new Templates();
app.engine('hbs', engine(handlebars));

const pages = app.create('pages');
const layouts = app.create('layouts', { kind: 'layout' });
// const view = pages.view('templates/foo.hbs', {
//   contents: Buffer.from('Name: {{name}}'),
//   data: { name: 'Brian' },
//   layout: 'default'
// });

const view = await pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian', description: 'This is a page' },
  layout: 'default'
});

await layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after') });
await layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after'), layout: 'base' });
let n = 0;

bench('layouts')
  // .add('collection.renderLayout()', () => {
  //   const collection = new Collection('layouts', { kind: 'layout '});
  //   collection.set({ path: 'default', contents: 'before {{name}} after' });
  //   const view = new View({ path: 'foo/bar', contents: 'before {{name}} after' });
  // })
  .add('collection.renderLayout()', () => {

    try {
      const contents = view.contents;
      await app.render(view);
      // console.log(view.contents.toString());
      // view.contents = contents;
      delete view.layoutStack;
    } catch (err) {
      // console.log(err);
    }

    // if (n >= 3) process.exit();
    // n++;

  })
  .run({ async: true });

})();

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

