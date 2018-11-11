const App = require('../');
const app = new App({ handlers: ['onLoad', 'onFoo'] });
const pages = app.create('pages');

(async function() {

app.onFoo(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      console.log(view);
      view.winner = 'app';
      resolve();
    }, 20)
  });
});

pages.onFoo(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      console.log(view);
      view.winner = 'collection';
      view.extname = '.html';
      resolve();
    }, 10);
  });
});

const page = await pages.set('templates/bar.hbs', { contents: Buffer.from('foo') })
await app.handle('onFoo', page);
console.log('The winner is!', page.winner);
})().catch(console.log);
