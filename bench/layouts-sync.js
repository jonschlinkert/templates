const handlebars = require('handlebars');
const engine = require('../lib/engines');
const timer = require('./timer');
const Templates = require('../');
const app = new Templates({ sync: true, handlers: ['onLoad', 'preRender', 'postRender'] });
const hbs = engine(handlebars);

app.engine('hbs', hbs);

app.preRender(/./, file => {
  file.data.title = file.data.title || file.stem;
  if (view.kind === 'renderable' && !/{{/.test(view.contents.toString())) {
    view.engine = 'noop';
  }
  file.orig = file.orig || file.contents;
  file.count = file.count ? file.count + 1 : 1;
});

app.postRender(/./, file => {
  console.log(file.contents.toString());
  file.contents = file.orig;
});

const pages = app.create('pages');
const layouts = app.create('layouts', { kind: 'layout' });

const view = pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: '),
  // contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

// layouts
layouts.set({
  path: 'body',
  data: { title: 'Blog' },
  contents: Buffer.from(`
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
  </head>
  <body>
    {% body %}
  </body>
</html>`)
});
layouts.set({
  path: 'base',
  layout: 'body',
  contents: Buffer.from('before\n{% body %}\nafter')
});
layouts.set({
  path: 'default',
  layout: 'base',
  contents: Buffer.from('before\n{% body %}\nafter')
});

const run = timer.sync(app, view, layouts.views);

run(1)
run(10);
// run(100);
// run(1000);
// run(10000);
// run(100000);
// run(1000000);
// run(10000000);
