// const pages = app.collection({ handlers: ['onLoad'] });
const posts = app.create('posts');
const pages = app.create('pages');

app.onLoad(/\.hbs$/, function(view) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      console.log(view);
      resolve();
    }, 10)
  });
});

posts.set('templates/foo.hbs', { contents: new Buffer('foo') });
posts.set('templates/bar.hbs', { contents: new Buffer('bar') })
  .then(() => {
    console.log(posts)
  });

pages.set('templates/baz.hbs', { contents: new Buffer('baz') });
pages.set('templates/qux.hbs', { contents: new Buffer('qux') })
  .then(() => {
    console.log(pages)
  });
