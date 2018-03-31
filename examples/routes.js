const App = require('../');
const app = new App();

const pages = app.create('pages', { handlers: ['onLoad', 'preRender', 'postRender'] });
const view = pages.view({ path: 'foo/bar/index.js', count: 0 });

pages.router.on('handle', (method, view, route) => {
  console.log(`${route.status} ${method}:`, view);
});

pages.router.on('layer', console.log);

pages
  .onLoad(/./, view => (view.count++))
  .onLoad(/./, view => (view.count++))

  .preRender(/./, view => (view.count++))
  .preRender(/./, view => (view.count++))

  .postRender(/./, view => (view.count++))
  .postRender(/./, view => (view.count++))

pages.handle('onLoad', view)
  .then(view => pages.handle('preRender', view))
  .then(view => pages.handle('postRender', view))
  .then(() => console.log('Count:', view.count))
  .catch(console.error);
