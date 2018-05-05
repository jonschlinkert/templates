(async function() {

const handlebars = require('handlebars');
const engine = require('./examples/support/engine');
const Templates = require('./');
const app = new Templates();
app.engine('hbs', engine(handlebars));

const pages = app.create('pages');
const layouts = app.create('layouts', { kind: 'layout' });

const view = await pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

await layouts.set({ path: 'foo', contents: Buffer.from('before {% body %} after') });
await layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'foo' });
await layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after'), layout: 'base' });

let count = 1000000;
console.time('layout');

while (count--) {
  await app.render(view, { description: 'This is page: ' + count });
}

console.timeEnd('layout')
})();
