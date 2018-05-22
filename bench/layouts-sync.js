const timer = require('./timer');
const engine = require('../lib/engines');
const Templates = require('../');
const app = new Templates({
  sync: true,
  handlers: ['onLoad', 'preRender', 'postRender', 'postLayout']
});

app.engine('hbs', engine(require('handlebars')));
app.create('pages');
app.create('layouts', { kind: 'layout' });

const files = [];
files.forEach(f => pages.set(f, { path: f }));

app.preRender(/./, file => {
  file.data.title = file.data.title || file.stem;
  file.orig = file.orig || file.contents;
  file.count = file.count ? file.count + 1 : 1;
});


app.postRender(/./, file => {
  // console.log(file.contents.toString());
  file.contents = file.orig;
});

app.postLayout(/./, file => {
  if (view.kind === 'renderable' && !/{{/.test(view.contents.toString())) {
    view.engine = 'noop';
  }
});

const view = app.pages.set('some/random/page.hbs', {
  // contents: Buffer.from('This is some content without any templates.'),
  contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

// layouts
app.layouts.set({
  path: 'body',
  data: { title: 'Blog' },
  contents: Buffer.from(`
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title></title>
  </head>
  <body>
    {% body %}
  </body>
</html>`)
});

app.layouts.set({
  path: 'base',
  layout: 'body',
  contents: Buffer.from('before\n{% body %}\nafter')
});

app.layouts.set({
  path: 'default',
  layout: 'base',
  contents: Buffer.from('before\n{% body %}\nafter')
});

const run = timer.sync(app, view, app.layouts.views);

run(1)
run(10);
run(100);
run(1000);
run(10000);
run(100000);
run(1000000);
run(10000000);
