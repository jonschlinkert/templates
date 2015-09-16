var templates = require('./');
var app = templates();

app.engine('html', require('engine-base'));

app.create('pages')
  .addView('home.html', {content: 'The <%= title %> page'})
  .set('locals.title', 'Home')
  .render(function (err, res) {
    if (err) return console.log(err);
    console.log(res.content);
  })

/**
 * Events
 */

var posts = app.create('posts');

posts.on('addView', function (key, value) {
  posts.queue.push(posts.view(key, {content: value}));
});

posts.addView('home.html', 'The <%= title %> page');
console.log(posts.views)
