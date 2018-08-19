(async function() {

const handlebars = require('handlebars');
const engine = require('templates/lib/engines');
const Templates = require('templates');
const app = new Templates();
app.engine('hbs', engine(handlebars));

const pages = app.create('pages');
const partials = app.create('partials', { kind: 'partial' });
const layouts = app.create('layouts', { kind: 'layout' });

const view = await pages.set('templates/foo.hbs', {
  contents: Buffer.from('This is page: {{num}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

// await partials.set({ path: 'button', contents: Buffer.from('<button>Click me</button>') });
await layouts.set({ path: 'foo', contents: Buffer.from('before {% body %} after') });
await layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'foo' });
await layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after'), layout: 'base' });

let max = 1e4;
let i = 0;
console.time(`processed ${max.toLocaleString()} layouts in`);

while (++i <= max) {
  try {
    await app.render(view, { num: i, layouts });
    // console.log(view.contents.toString());
    // view.reset();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

console.timeEnd(`processed ${max.toLocaleString()} layouts in`);
})();
