const argv = require('minimist')(process.argv.slice(2));
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const Templates = require('templates');

const runner = require('setup/runner');
const app = new Templates({ handlers: ['onLoad', 'preRender', 'postRender'], sync: true });
let state = { vars: 0, helpers: 0, partials: 0, inline: 0 };

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

let matched = new Set();

app.onLoad(/./, file => {
  if (!matched.has(file)) {
    matched.add(file);
    detect(file.contents.toString());
  }
});

app.partials.onLoad(/./, file => {
  file.engine = '.hbs';
  app.options.registerPartials = false;
  return app.compile(file);
});

app.helper('upper', str => str ? str.toUpperCase() : '');

// app.preRender(/./, file => {
//   if (file.kind === 'renderable') {
//     file[orig] = file[orig] || file.contents;
//     file.contents = file[orig];
//   }
//   file.count = file.count ? file.count + 1 : 1;
// });

// app.postRender(/./, (file, params) => {
//   if (argv.v) console.log(file.contents.toString());
//   // file.contents = file[orig];
// });

const file = pages.set('templates/foo.hbs', {
  contents: Buffer.from('{{#*inline "above"}}INLINE ABOVE - Title: {{title}}{{/inline}}Name: {{upper name}}, {{upper description}}\n{{> button text="Click me!" }}\n{{> nav id="navigation" }}\n{{> section text="Blog Posts" }}\n'),
  // contents: Buffer.from('Name: {{upper name}}, {{upper description}}\n{{> button text="Click me!" }}\n{{> nav id="navigation" }}\n{{> section text="Blog Posts" }}\n'),
  // contents: Buffer.from('Name: {{upper name}}, {{upper description}}\n'),
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
  contents: Buffer.from('BEFORE\n{% body %}\nAFTER')
});

layouts.set({
  path: 'default',
  layout: 'base',
  contents: Buffer.from('BEFORE\n{% body %}\nAFTER')
});

const run = runner.sync(app, file, layouts, state);

run(1);
run(10);
run(100);
run(1e3); // 1k
// run(1e4); // 10k
// run(1e5); // 100k
// run(1e6); // 1m

function detect(str) {
  let matches = str.match(/{{[^>\/#*}]+?}}/g);
  if (matches) {
    let helpers = matches.filter(v => v.includes(' '));
    let vars = matches.filter(v => !helpers.includes(v));
    state.helpers += helpers.length;
    state.vars += vars.length;
  }

  let partials = str.match(/{{[>#*]+.*?}}/g);
  if (partials) {
    let inline = partials.filter(v => v.includes('*'));
    let rest = partials.filter(v => !inline.includes(v));
    state.partials += rest.length;
    state.inline += inline.length;
  }
}
