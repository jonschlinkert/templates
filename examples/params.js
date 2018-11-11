const path = require('path');
const App = require('../');
const app = new App({ handlers: ['onLoad'] });
const pages = app.create('pages');

app.onLoad('(.*/?)templates/(.*)', function(view, params) {
  view.path = path.join(params[0], params[1]);
});

pages.set('a/b/c/templates/whatever/foo.hbs', { contents: Buffer.from('foo') })
  .then(() => {
    for (const [key, file] of pages.files) {
      console.log(file.path);
    }
  })
  .catch(console.error);
