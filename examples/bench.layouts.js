(async function() {

const handlebars = require('handlebars');
const engine = require('../lib/engine');
const Templates = require('../');
const app = new Templates();
app.engine('hbs', engine(handlebars));

const pages = app.create('pages');
const partials = app.create('partials', { kind: 'partial' });
const layouts = app.create('layouts', { kind: 'layout' });

const view = await pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

// await partials.set({ path: 'button', contents: Buffer.from('<button>Click me</button>') });
await layouts.set({ path: 'foo', contents: Buffer.from('before {% body %} after') });
await layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'foo' });
await layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after'), layout: 'base' });

console.time('layout');
let max = 1000000;
let i = 0;

while (i++ < max) {
  try {
    await app.render(view, { description: 'This is page: ' + i });
    // console.log(view.contents.toString());
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

console.timeEnd('layout');
})();
