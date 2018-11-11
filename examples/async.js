const App = require('../');
const app = new App({ handlers: ['onLoad' ] });

(async () => {
  const pages = app.create('pages');
  pages.onLoad(/\.hbs$/, file => console.log(file));

  await pages.set('templates/foo.hbs', { contents: Buffer.from('foo') });
  await pages.set('templates/bar.hbs', { contents: Buffer.from('foo') })

  console.log(pages);

})().catch(console.log);


