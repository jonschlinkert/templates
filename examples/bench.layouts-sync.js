const handlebars = require('handlebars');
const engine = require('../lib/engine');
const Templates = require('../');
const app = new Templates({ sync: true, handlers: ['onLoad'] });
const hbs = engine(handlebars);
app.engine('hbs', hbs, { main: true });
app.onLoad(/./, function(view) {
  view.fn = view.fn || hbs.instance.compile(view.contents.toString());
});

const pages = app.create('pages');
const partials = app.create('partials', { kind: 'partial' });
const layouts = app.create('layouts', { kind: 'layout' });

const view = pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}} {{> button text="Click me!" }} {{> button2 text="Click me too!" }} {{> button3 text="Click me three!" }}'),
  data: { name: 'Brian' },
  layout: 'default'
});

partials.set({ path: 'button', contents: Buffer.from('<button>{{text}}</button>') });
partials.set({ path: 'button2', contents: Buffer.from('<button>{{text}}</button>') });
partials.set({ path: 'button3', contents: Buffer.from('<button>{{text}}</button>') });
layouts.set({ path: 'foo', contents: Buffer.from('before {% body %} after') });
layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'foo' });
layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after'), layout: 'base' });

console.time('layout');
let max = 1000000;
let i = 0;

while (i++ < max) {
  try {
    app.renderSync(view, { description: 'This is page: ' + i });
    // console.log(view.contents.toString());
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}
console.timeEnd('layout');
