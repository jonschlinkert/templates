const App = require('../');
const app = new App({ handlers: ['onLoad'] });
const pages = app.create('pages');

app.onLoad(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      console.log(view);
      view.winner = 'app';
      resolve();
    }, 20)
  });
});

pages.onLoad(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      console.log(view);
      view.winner = 'collection';
      resolve();
    }, 10)
  });
});

pages.set('templates/foo.hbs', { contents: new Buffer('foo') });
pages.set('templates/bar.hbs', { contents: new Buffer('foo') })
  .then(() => {
    for (const key of Object.keys(pages.views)) {
      console.log(pages.views[key].winner)
    }
  });

// console.log('ONE:', pages);
