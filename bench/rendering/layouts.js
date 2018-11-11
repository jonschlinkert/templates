(async function() {

const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const Templates = require('templates');
const app = new Templates();
app.engine('hbs', engine(handlebars));

const pages = app.create('pages');
const partials = app.create('partials', { kind: 'partial' });
const layouts = app.create('layouts', { kind: 'layout' });

const file = await pages.set('templates/foo.hbs', {
  contents: Buffer.from('This is page: {{num}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

// await partials.set({ path: 'button', contents: Buffer.from('<button>Click me</button>') });
await layouts.set({ path: 'foo', contents: Buffer.from('1 {% body %} 1') });
await layouts.set({ path: 'base', contents: Buffer.from('2 {% body %} 2'), layout: 'foo' });
await layouts.set({ path: 'default', contents: Buffer.from('3 {% body %} 3'), layout: 'base' });

let start = Date.now();
let count = 1e4;
let i = 0;
let title = `processed ${count.toLocaleString()} layouts in`;
console.time(title);

while (++i <= count) {
  try {
    await app.render(file, { num: i, layouts });
    // console.log(file.contents.toString());
    // file.reset();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

let end = Date.now();
let diff = end - start;
let per = diff / count;
console.timeEnd(title);
console.log(per, 'per file');
console.log(+(per / layouts.files.size).toFixed(4), 'per layout');
})();
