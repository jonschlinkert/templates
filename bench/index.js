const { Suite } = require('benchmark');
const cursor = require('ansi')(process.stdout);
const Templates = require('..');

const cycle = (e, nl) => {
  cursor.eraseLine();
  cursor.horizontalAbsolute();
  cursor.write('  ' + e.target);
  if (nl) cursor.write('\n');
};

function bench(name) {
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

// bench('instantiate app')
//   .add('no options', () => {
//     new Templates();
//   })
//   .add('options', () => {
//     new Templates({
//       handlers: ['onLoad', 'preRender', 'postRender', 'preWrite', 'postWrite']
//     });
//   })
//   .run();

// bench('instantiate collection')
//   .add('app.create()', () => {
//     const app = new Templates();
//     app.create('pages');
//   })
//   .add('app.create() with options', () => {
//     const app = new Templates();
//     app.create('layouts', { type: 'layout' });
//   })
//   .add('new Collection()', () => {
//     new Templates.Collection('pages');
//   })
//   .add('new Collection() with options', () => {
//     new Templates.Collection('layouts', { type: 'layout' });
//   })
//   .run();

bench('instantiate view')
  .add('app.view()', () => {
    const app = new Templates();
    app.view('foo', { path: 'foo/bar' });
  })
  .add('view from app.create() collection', () => {
    const app = new Templates();
    app.create('layouts', { type: 'layout' });
    app.layouts('foo', { path: 'foo/bar' });
  })
  .add('new View()', () => {
    new Templates.View({ path: 'foo/bar' });
  })
  .run();

// bench('rendering')
//   .add('ansi-colors', () => {
//     names.forEach(name => color[name]('foo'));
//   })
//   .run();
