console.time('total');
const App = require('../');
const app = new App();

const pages = app.create('pages', { handlers: ['onLoad', 'preRender', 'postRender'] });
const file = pages.file({ path: 'foo/bar/index.js', count: 0 });

pages.router.on('handle', (method, file, route) => {
  console.log(`${route.status} ${method}:`, file);
});

pages.router.on('layer', console.log);

pages
  .onLoad(/./, file => (file.count++))
  .onLoad(/./, file => (file.count++))

  .preRender(/./, file => (file.count++))
  .preRender(/./, file => (file.count++))

  .postRender(/./, file => (file.count++))
  .postRender(/./, file => (file.count++))

pages.handle('onLoad', file)
  .then(file => pages.handle('preRender', file))
  .then(file => pages.handle('postRender', file))
  .then(() => console.log('Count:', file.count))
  .then(() => console.timeEnd('total'))
  .catch(console.error);
