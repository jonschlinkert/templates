const handlebars = require('handlebars');
const engine = require('../lib/engine');
const Templates = require('../');
const app = new Templates({ sync: true, handlers: ['onLoad'] });
const hbs = engine(handlebars);

app.engine('hbs', hbs);

app.create('pages');
app.create('layouts', { kind: 'layout' });
app.create('partials', { kind: 'partial' });
app.onLoad(/\.hbs$/, hbs.compile.bind(hbs));
// app.layouts.onLoad(/\.hbs$/, hbs.compile.bind(hbs));
// app.onLoad(/\.hbs$/, app.compile.bind(app));

const view = app.pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}} {{> button text="Click me!" }} {{> button2 text="Click me too!" }} {{> button3 text="Click me three!" }}'),
  data: { name: 'Brian' },
  layout: 'default'
});

app.layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after') });
app.partials.set({ path: 'button', contents: Buffer.from('<button>{{text}}</button>') });
app.partials.set({ path: 'button2', contents: Buffer.from('<button>{{text}}</button>') });
app.partials.set({ path: 'button3', contents: Buffer.from('<button>{{text}}</button>') });
app.layouts.set({ path: 'foo', contents: Buffer.from('before {% body %} after') });
app.layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'foo' });

// const view = app.pages.set('templates/foo.hbs', {
//   contents: Buffer.from('Name: {{name}}. {{description}}. {{> button text="Click me!" }}'),
//   data: { name: 'Brian' },
//   layout: 'default'
// });

console.time('layout');
let max = 10000;
let i = 0;
// console.log(view.contents.toString());
// app.render(view, { description: 'This is page: ' + i++ });
// // console.log(view.contents.toString());
// app.render(view, { description: 'This is page: ' + i++ });
// // console.log(view.contents.toString());
// app.render(view, { description: 'This is page: ' + i++ });
// // console.log(view.contents.toString());
// app.render(view, { description: 'This is page: ' + i++ });
// console.log(view.contents.toString());

while (i++ < max) {
  try {
    app.render(view, { description: 'This is page: ' + i });
    // console.log(view.contents.toString());
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}
console.timeEnd('layout');
