'use strict';

const handlebars = require('handlebars');
const engine = require('templates/lib/engines');
const runner = require('setup/runner');

(async function() {
  const Templates = require('templates');
  const app = new Templates();

  const pages = app.create('pages');
  const partials = app.create('partials', { kind: 'partial' });
  const layouts = app.create('layouts', { kind: 'layout' });

  app.data({ site: { title: 'Blog' }});
  app.engine('hbs', engine(handlebars.create()));

  const view = await pages.set('templates/foo.hbs', {
    contents: Buffer.from('Name: {{name}}, {{description}}'),
    data: { name: 'Brian' },
    layout: 'inner'
  });

  // layouts
  await layouts.set({
    path: 'default',
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

  await layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'default' });
  await layouts.set({ path: 'inner', contents: Buffer.from('before {% body %} after'), layout: 'base' });

  const run = runner(app, view, layouts);

  await run(1);
  await run(10);
  await run(100);
  await run(1000);
  await run(10000);
  await run(100000);
  // await run(1000000); // 1m
})();

// processed 1,000,000 pages with 3 layouts, 3 partials and a helper, each in 25.78s:
//  ~8.5949mµ per layout
//  ~25.7847mµ per page
