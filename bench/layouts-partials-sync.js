const argv = require('minimist')(process.argv.slice(2));
const handlebars = require('handlebars');
const engine = require('../lib/engines');
const timer = require('./timer');
const Templates = require('../');
const app = new Templates({
  handlers: ['onLoad', 'preRender', 'postRender'],
  sync: true
});

app.options.transform = (str, file, layout) => {
  file.data = { ...layout.data, ...file.data };
  return str;
};

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

app.helper('upper', function(str, options) {
  return str ? str.toUpperCase() : '';
});

app.preRender(/./, file => {
  file[orig] = file[orig] || file.contents;
  file.count = file.count ? file.count + 1 : 1;
});

app.postRender(/./, (file, params) => {
  // if (argv.v) console.log(file.contents.toString());
  file.contents = file[orig];
});

const view = pages.set('templates/foo.hbs', {
  contents: Buffer.from(`{{#*inline "above"}}INLINE ABOVE - Title: {{title}}{{/inline}}Name: {{upper name}}, {{upper description}}\n{{> button text="Click me!" }}\n{{> nav id="navigation" }}\n{{> section text="Blog Posts" }}\n`),
  // contents: Buffer.from(`{{#*inline "above"}}INLINE ABOVE - Title: {{title}}{{/inline}}Name: {{upper name}}, {{upper description}}\n{{> button text="Click me!" }}\n{{> nav id="navigation" }}\n{{> section text="Blog Posts" }}\n`),
  data: { name: 'Brian' },
  layout: 'default'
});

// partials
partials.set({ path: 'button', contents: Buffer.from('\n<button>{{upper text}}</button>') });
partials.set({ path: 'nav', contents: Buffer.from('\n<div id="{{id}}"></div>') });
partials.set({ path: 'section', contents: Buffer.from('\n<section>{{upper text}}</section>') });
partials.set({ path: 'above', contents: Buffer.from('\n<section>ABOVE</section>') });
partials.set({ path: 'below', contents: Buffer.from('PARTIAL BELOW') });

// layouts
layouts.set({
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
        {{#> above . }} Default "above" content {{/above}}
        {% body %}
        {{#> below}} Default "below" content {{/below}}
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

run(1);
run(10);
run(100);
run(1000);
run(10000);
// run(100000);
// run(1000000);
// run(10000000);
