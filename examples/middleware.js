const App = require('../');
const app = new App({ handlers: ['onLoad'] });
const pages = app.create('pages');

app.onLoad(/\.hbs$/, function(file) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      console.log(file);
      file.winner = 'app';
      resolve();
    }, 20)
  });
});

pages.onLoad(/\.hbs$/, function(file) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      console.log(file);
      file.winner = 'collection';
      resolve();
    }, 10)
  });
});

(async () => {

await pages.set('templates/foo.hbs', { contents: Buffer.from('foo') });
await pages.set('templates/bar.hbs', { contents: Buffer.from('foo') });

for (const [key, file] of pages.files) {
  console.log(file.winner);
}

})().catch(console.log);
