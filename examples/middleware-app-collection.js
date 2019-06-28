'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const App = require('../');
const app = new App({ handlers: ['onLoad', 'onFoo'] });
const pages = app.create('pages', { type: 'renderable' });

(async function() {

app.onFoo(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, 20)
  });
});

app.onFoo(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, 20)
  });
});

app.onFoo(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve();
    }, 20)
  });
});

pages.onFoo(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      view.extname = '.html';
      resolve();
    }, 10);
  });
});

const page = await pages.set('templates/bar.hbs', { contents: Buffer.from('foo') })
await app.handle('onFoo', page);

})().catch(console.log);
