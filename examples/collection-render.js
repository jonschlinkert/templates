const handlebars = require('handlebars/dist/handlebars.js');
const Collection = require('../lib/collection');
const engine = require('engine-handlebars');

(async () => {

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
  default: pages.file({ path: 'default.hbs', contents: Buffer.from('before {% body %} after') })
};

pages.engine('hbs', engine(handlebars));

pages.preLayout(/\.hbs$/, file => {
  return new Promise(resolve => {
    setTimeout(function() {
      file.layout = 'default';
      resolve(file);
    }, 250)
  });
});

pages.preRender(/\.hbs$/, file => {
  file.data.name = file.stem.toUpperCase();
});

await pages.set('templates/foo.hbs', { contents: Buffer.from('{{name}}') });
await pages.set('templates/bar.hbs', { contents: Buffer.from('{{name}}') });
await pages.set('templates/baz.hbs', { contents: Buffer.from('{{name}}') });

for (let key of [...pages.files.keys()]) {
  let file = pages.files.get(key);
  let res = await pages.render(file);
  console.log(res.contents.toString());
}

})().catch(console.log);
