const Collection = require('../lib/collection');
const pages = new Collection('pages', { handlers: ['onLoad'] });


pages.onLoad(/\.hbs$/, function(view) {
  setTimeout(() => {
    console.log('Page:', view);
    view.foo = 'bar';
  }, 100);
});

pages.onLoad(/\.hbs$/, function(view) {
  setTimeout(() => {
    console.log('Page:', view);
    view.foo = 'bar';
  }, 500);
});

pages.set('templates/foo.hbs', { contents: Buffer.from('foo') });
pages.set('templates/bar.hbs', { contents: Buffer.from('bar') });
pages.set('templates/baz.hbs', { contents: Buffer.from('baz') })
  .then(view => {
    console.log('after');
    console.log(view)
  })
