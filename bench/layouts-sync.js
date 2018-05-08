const handlebars = require('handlebars');
const engine = require('../lib/engines');
const timer = require('./timer');
const Templates = require('../');
const app = new Templates({ sync: true, handlers: ['onLoad', 'preRender', 'postRender'] });
const hbs = engine(handlebars);

app.engine('hbs', hbs);

app.preRender(/./, file => {
  file._orig = file._orig || file.contents;
  file.count = file.count ? file.count + 1 : 1;
});

app.postRender(/./, file => {
  // console.log(file.contents.toString());
  file.contents = file._orig;
});

const pages = app.create('pages');
const layouts = app.create('layouts', { kind: 'layout' });

const view = pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian' },
  render: false,
  layout: 'default'
});

layouts.set({ path: 'foo', contents: Buffer.from('before {% body %} after') });
layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'foo' });
layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after'), layout: 'base' });

const run = timer(app, view, layouts.views);

run(1)
run(10);
run(100);
run(1000);
run(10000);
run(100000);
run(1000000);
run(10000000);
