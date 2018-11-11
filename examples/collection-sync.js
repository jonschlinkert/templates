const Collection = require('../lib/collection');
const engine = require('engine-handlebars');
const pages = new Collection('pages', { handlers: ['onLoad'], sync: true });

pages.engine('hbs', engine(require('handlebars')));
pages.onLoad(/\.hbs$/, function(view) {
  console.log('Page:', view);
  view.foo = 'bar';
});

pages.set('templates/foo.hbs', { contents: Buffer.from('{{ file.path }}') });
pages.set('templates/bar.hbs', { contents: Buffer.from('{{ file.path }}') });
pages.set('templates/baz.hbs', { contents: Buffer.from('{{ file.path }}') });

const file = pages.render('foo.hbs');
console.log(file.contents.toString());
