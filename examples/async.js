const App = require('../');
const app = new App({ handlers: ['onLoad' ] });
const pages = app.create('pages');

pages.onLoad(/\.hbs$/, function(view) {
  console.log(view);
});

pages.set('templates/foo.hbs', { contents: new Buffer('foo') });
pages.set('templates/bar.hbs', { contents: new Buffer('foo') })
  .then(view => {
    console.log(pages)
  });

