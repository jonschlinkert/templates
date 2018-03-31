const Collection = require('../lib/collection');
const engine = require('./support/engine');

(async function() {

const pages = new Collection('pages', {
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

pages.options.layouts = {
  default: pages.view({ path: 'default.hbs', contents: Buffer.from('before {% body %} after') })
};

pages.engine('hbs', engine);

pages.preLayout(/\.hbs$/, view => {
  return new Promise(resolve => {
    setTimeout(function() {
      view.layout = 'default';
      resolve(view);
    }, 250)
  });
});

pages.preRender(/\.hbs$/, view => {
  view.data.name = view.stem.toUpperCase();
});

pages.set('templates/foo.hbs', { contents: Buffer.from('{{name}}') });
pages.set('templates/bar.hbs', { contents: Buffer.from('{{name}}') });
pages.set('templates/baz.hbs', { contents: Buffer.from('{{name}}') });

for (const key of Object.keys(pages.views)) {
  const view = pages.views[key];
  const res = await pages.render(view);
  console.log(res.contents.toString());
}

})();
