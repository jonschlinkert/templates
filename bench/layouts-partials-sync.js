const argv = require('minimist')(process.argv.slice(2));
const handlebars = require('handlebars');
const engine = require('../lib/engines');
const timer = require('./timer');
const Templates = require('../');
const app = new Templates({
  handlers: ['onLoad', 'preRender', 'postRender'],
  preserveWhitespace: true,
  sync: true
});

const hbs = engine(handlebars);
const pages = app.create('pages');
const partials = app.create('partials', { kind: 'partial' });
const layouts = app.create('layouts', { kind: 'layout' });
const orig = Symbol('contents');

app.engine('hbs', hbs);
// app.partials.onLoad(/./, view => {
//   // app.options.registerPartials = false;
//   // hbs.compile(view);
//   // hbs.instance.registerPartial(view.stem, view.fn);
//   // app.compile(view);
// });

app.preRender(/./, file => {
  file[orig] = file[orig] || file.contents;
  file.count = file.count ? file.count + 1 : 1;
});

app.postRender(/./, file => {
  if (argv.v) console.log(file.contents.toString());
  file.contents = file[orig];
});

const view = pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}} {{> button text="Click me!" }} {{> nav id="navigation" }} {{> section text="Blog Posts" }}'),
  data: { name: 'Brian' },
  layout: 'default'
});

// partials
partials.set({ path: 'button', contents: Buffer.from('<button>{{text}}</button>') });
partials.set({ path: 'nav', contents: Buffer.from('<div id="{{id}}"></div>') });
partials.set({ path: 'section', contents: Buffer.from('<section>{{text}}</section>') });

// layouts
layouts.set({
  path: 'body',
  contents: Buffer.from(`
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
  </head>
  <body>
    {% body %}
  </body>
</html>`)
});
layouts.set({
  path: 'base',
  contents: Buffer.from('before\n{% body %}\nafter'),
  layout: 'body'
});
layouts.set({
  path: 'default',
  contents: Buffer.from('before\n{% body %}\nafter'),
  layout: 'base'
});

const run = timer(app, view, layouts.views);
// const arr = [1, 10, 100, 1000, 10000, 100000, 1000000];
// const arr = [1, 10, 100, 1000, 10000, 100000];

// for (const n of arr) {
//   // if (argv.)
//   run(arr[n]);
// }

run(1);
run(10);
run(100);
run(1000);
run(10000);
run(100000);
// run(1000000);
// run(10000000);
