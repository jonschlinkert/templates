const argv = require('minimist')(process.argv.slice(2));
const handlebars = require('handlebars');
const engine = require('../lib/engines');
const timer = require('./timer');

(async function() {
  const Templates = require('../');
  const app = new Templates({
    handlers: ['onLoad', 'preRender', 'postRender'],
    // preserveWhitespace: true,
    // asyncHelpers: true
  });

  const hbs = engine(handlebars);
  const pages = app.create('pages');
  const partials = app.create('partials', { kind: 'partial' });
  const layouts = app.create('layouts', { kind: 'layout' });
  const orig = Symbol('contents');
  const wait = (fn, n = 0) => new Promise(resolve => setTimeout(() => resolve(fn()), n));

  app.options.transform = (str, file, layout) => {
    file.data = { ...layout.data, ...file.data };
    return str;
  };

  app.engine('hbs', hbs);

  // app.helper('upper', async function(str) {
  //   return await wait(() => str.toUpperCase());
  // });

  app.helper('upper', function(str) {
    return str.toUpperCase();
  });

  app.preRender(/./, file => {
    file[orig] = file[orig] || file.contents;
    file.count = file.count ? file.count + 1 : 1;
  });

  app.postRender(/./, file => {
    if (argv.v) console.log(file.contents.toString());
    file.contents = file[orig];
  });

  const view = await pages.set('templates/foo.hbs', {
    contents: Buffer.from(
      'Name: {{upper name}}, {{upper description}} {{> button text="Click me!" }} {{> nav id="navigation" }} {{> section text="Blog Posts" }}'
    ),
    data: { name: 'Brian' },
    layout: 'default'
  });

  // partials
  await partials.set({
    path: 'button',
    contents: Buffer.from('<button>{{upper text}}</button>')
  });
  await partials.set({
    path: 'nav',
    contents: Buffer.from('<div id="{{id}}"></div>')
  });
  await partials.set({
    path: 'section',
    contents: Buffer.from('<section>{{upper text}}</section>')
  });

  // layouts
  await layouts.set({
    path: 'body',
    data: { title: 'Blog' },
    contents: Buffer.from(`
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>{{upper title}}</title>
        </head>
        <body>
          {% body %}
        </body>
      </html>`)
  });
  await layouts.set({
    path: 'base',
    layout: 'body',
    contents: Buffer.from('before\n{% body %}\nafter')
  });
  await layouts.set({
    path: 'default',
    layout: 'base',
    contents: Buffer.from('before\n{% body %}\nafter')
  });

  const run = timer(app, view, layouts.views);

  await run(1);
  await run(10);
  await run(100);
  await run(1000);
  await run(10000);
  await run(100000);
  await run(1000000);
})();

// processed 1,000,000 pages with 3 layouts, 3 partials and a helper, each in 25.78s:
//  ~8.5949mµ per layout
//  ~25.7847mµ per page
