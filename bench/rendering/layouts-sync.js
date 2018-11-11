const runner = require('setup/runner');
const engine = require('engine-handlebars');
const Templates = require('templates');

const app = new Templates({ sync: true });
app.engine('hbs', engine(require('handlebars')));

const layouts = app.create('layouts', { kind: 'layout' });
const pages = app.create('pages');

const file = pages.set('some/random/page.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

const file2 = pages.set('some/random/page.hbs', {
  contents: Buffer.from('This is some content without any templates.'),
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

const run = runner.sync(app, file, app.layouts);

run(1);
run(10);
run(100);
run(1e3); // 1k
run(1e4); // 10k
run(1e5); // 100k
// run(1e6); // 1m
