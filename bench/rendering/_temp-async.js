const handlebars = require('handlebars');
const engine = require('templates/lib/engines');
const runner = require('setup/runner');

(async function() {
  const Templates = require('templates');
  const app = new Templates({
    // handlers: ['onLoad', 'preRender', 'postRender'],
    // preserveWhitespace: true,
    // asyncHelpers: true
  });

  const pages = app.create('pages');
  const partials = app.create('partials', { kind: 'partial' });
  const layouts = app.create('layouts', { kind: 'layout' });
  const wait = (fn, n = 0) => new Promise(resolve => setTimeout(() => resolve(fn()), n));

  // app.options.transform = (str, file, layout) => {
  //   file.data = { ...layout.data, ...file.data };
  //   return str;
  // };

  app.data({ site: { title: 'Blog' }});
  app.engine('hbs', engine(handlebars.create()));

  app.helper('upper', async function(str = '') {
    return await wait(() => str.toUpperCase());
  });

  // app.helper('upper', function(str) {
  //   return str.toUpperCase();
  // });

  const view = await pages.set('templates/foo.hbs', {
    contents: Buffer.from(
      // 'Name: {{upper name}}, {{upper description}} {{> button text="Click me!" }} {{> nav id="navigation" }} {{> section text="Blog Posts" }}'
      'Name: {{name}}, {{description}}'
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
    data: { title: 'Blog', description: 'Awesome blog' },
    contents: Buffer.from(`
      <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>{{site.title}}</title>
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

  const run = runner(app, view, layouts);

  // await run(1);
  // await run(10);
  // await run(100);
  // await run(1000);
  // await run(5000);
  await run(10000);
  // await run(100000);
  // await run(1000000); // 1m
})();

// processed 1,000,000 pages with 3 layouts, 3 partials and a helper, each in 25.78s:
//  ~8.5949mµ per layout
//  ~25.7847mµ per page
