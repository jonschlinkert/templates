'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const Collection = require('../lib/collection');
const handlebars = require('handlebars/dist/handlebars.js');
const engine = require('engine-handlebars');

(async () => {

const pages = new Collection('pages', {
  type: 'renderable',
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

pages.option('engine', 'hbs');
pages.engine('hbs', engine(handlebars));

pages.preLayout(/\.hbs$/, file => {
  return new Promise(resolve => {
    setTimeout(function() {
      file.layout = 'default';
      resolve(file);
    }, 0)
  });
});

pages.preRender(/\.hbs$/, file => {
  file.data.name = file.stem.toUpperCase();
});

await pages.set('templates/foo.hbs', { contents: Buffer.from('{{name}}') });
await pages.set('templates/bar.hbs', { contents: Buffer.from('{{name}}') });
await pages.set('templates/baz.hbs', { contents: Buffer.from('{{name}}') });

let list = await Promise.all(pages.list.map(page => pages.render(page)));
console.log(list[0].contents.toString());

})().catch(console.log);
