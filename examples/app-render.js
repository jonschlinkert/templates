const App = require('..');
console.time('total');
console.time('hbs');
const handlebars = require('handlebars/dist/handlebars.js');
console.timeEnd('hbs');
const engine = require('./support/engine');

(async function() {
const app = new App({
  handlers: [
    'onLoad',
    'preCompile',
    'preLayout',
    'preRender',
    'postCompile',
    'postLayout',
    'postRender'
  ],
});

const pages = app.create('pages');
const layouts = app.create('layouts', { kind: 'layout' });
await layouts.set({ path: 'default.hbs', contents: Buffer.from('before {% body %} after') });

app.engine('hbs', engine(handlebars));

pages.preLayout(/\.hbs$/, view => {
  return new Promise(resolve => {
    process.nextTick(function() {
      console.log('collection');
      view.layout = 'default';
      resolve(view);
    });
  });
});

app.preLayout(/\.hbs$/, view => {
  return new Promise(resolve => {
    process.nextTick(function() {
      console.log('app');
      view.layout = 'default';
      resolve(view);
    });
  });
});

app.preRender(/\.hbs$/, view => {
  view.data.name = view.stem.toUpperCase();
});

await pages.set('templates/foo.hbs', { contents: Buffer.from('{{name}}') });
await pages.set('templates/bar.hbs', { contents: Buffer.from('{{name}}') });
await pages.set('templates/baz.hbs', { contents: Buffer.from('{{name}}') });
await pages.set('templates/qux.hbs', { contents: Buffer.from('{{arr.length}}') });
// console.log(pages)

for (const view of app.collections.get('pages').list) {
  const res = await app.render(view, { arr: ['a', 'b', 'c']});
  console.log(res.contents.toString());
}
console.timeEnd('total');
})().catch(console.error);
