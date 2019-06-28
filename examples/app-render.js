console.time('total');
const App = require('..');
console.time('hbs only');
const handlebars = require('handlebars/dist/handlebars.js');
const engine = require('engine-handlebars');
console.timeEnd('hbs only');

(async () => {

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

app.engine('hbs', engine(handlebars.create()));
app.option('engine', 'hbs');

const pages = app.create('pages', { type: 'renderable' });
const layouts = app.create('layouts', { type: 'layout' });
await layouts.set({ path: 'default.hbs', contents: Buffer.from('before {% body %} after') });

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

for (let view of app.collections.get('pages').list) {
  await app.render(view, { arr: ['a', 'b', 'c'] });
  console.log(view.contents.toString());
}

console.timeEnd('total');
})().catch(console.error);
