'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const App = require('../');
const app = new App({ handlers: ['onLoad'], parallel: true, sync: false });
const pages = app.create('pages');

app.onLoad(/\.hbs$/, file => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('App', file);
      resolve();
    }, 200)
  });
});

pages.onLoad(/\.hbs$/, file => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('Pages', file);
      resolve();
    }, 200)
  });
});

(async () => {

await pages.set('templates/foo.hbs', { contents: Buffer.from('foo') });
await pages.set('templates/bar.hbs', { contents: Buffer.from('foo') });

})().catch(console.log);
