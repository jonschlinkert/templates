const App = require('..');
const handlebars = require('handlebars');
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
const layouts = app.create('layouts', { type: 'layout' });
layouts.set({ path: 'default.hbs', contents: Buffer.from('before {% body %} after') });

app.engine('hbs', engine(handlebars));

pages.preLayout(/\.hbs$/, view => {
  return new Promise(resolve => {
    setTimeout(function() {
      console.log('collection');
      view.layout = 'default';
      resolve(view);
    }, 0);
  });
});

app.preLayout(/\.hbs$/, view => {
  return new Promise(resolve => {
    setTimeout(function() {
      console.log('app');
      view.layout = 'default';
      resolve(view);
    }, 0);
  });
});

app.preRender(/\.hbs$/, view => {
  view.data.name = view.stem.toUpperCase();
});

pages.set('templates/foo.hbs', { contents: Buffer.from('{{name}}') });
pages.set('templates/bar.hbs', { contents: Buffer.from('{{name}}') });
pages.set('templates/baz.hbs', { contents: Buffer.from('{{name}}') });

for (const key of Object.keys(app.collections.pages.views)) {
  const view = app.collections.pages.views[key];
  const res = await app.render(view);
  console.log(res.contents.toString());
}

})();
