const path = require('path');
const App = require('../');
const app = new App({ handlers: ['onLoad'] });
const pages = app.create('pages');

app.onLoad('(.*/?)templates/(.*)', function(view, params) {
  view.path = path.join(params[0], params[1]);
});

pages.set('a/b/c/templates/whatever/foo.hbs', { contents: new Buffer('foo') })
  .then(() => {
    for (const key of Object.keys(pages.views)) {
      console.log(pages.views[key].path)
    }
  });
