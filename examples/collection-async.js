const Collection = require('../lib/collection');
const pages = new Collection('pages', { handlers: ['onLoad'] });

(async () => {
pages.onLoad(/\.hbs$/, function(file) {
  return new Promise(res => {
    setTimeout(() => {
      console.log('Page:', file);
      file.extname = '.html';
      res(file);
    }, 100);
  });
});

pages.onLoad(/\.html$/, function(file) {
  return new Promise(res => {
    setTimeout(() => {
      console.log('Page:', file);
      res(file);
    }, 500);
  });
});

await pages.set('templates/foo.hbs', { contents: Buffer.from('foo') });
await pages.set('templates/bar.hbs', { contents: Buffer.from('bar') });
await pages.set('templates/baz.hbs', { contents: Buffer.from('baz') });
await pages.set('templates/qux.hbs', { contents: Buffer.from('qux') });
await pages.set('templates/fez.hbs', { contents: Buffer.from('fez') });

})().catch(console.log);
