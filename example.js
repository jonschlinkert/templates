var templates = require('./');
var app = templates();

/**
 * Engine
 */

app.option('view engine', '*');
app.engine('*', require('engine-base'));

/**
 * Collections and rendering
 */

app.create('pages')
  .addView('home', {content: 'The <%= title %> page'})
  .set('locals.title', 'HOOMMMME!')
  .render(function (err, res) {
    if (err) return console.log(err);
    console.log(res.content);
  })

/**
 * Plugins
 */

app.use(function (app) {
  app.section = app.create;
  return function (views) {
    views.on('addView', function () {
      console.log(views._callbacks)
    });

    // create a custom `.foo()` method on the collection
    views.define('foo', views.addView);
    return function (view) {

      // also add `.foo()` to the view instance for chaining
      view.define('foo', views.foo.bind(views));
    };
  };
});

app.section('articles')
  // this first `.foo` is from the collection instance
  .foo('one.html', {content: 'The <%= title %> page'})
  .set('locals.title', 'One')
  .render(function (err, res) {
    console.log(res.content)
  })
  // this `.foo` is from a `view` instance
  .foo('two.html', {content: 'The <%= title %> page'})
  .set('locals.title', 'Two')
  .render(function (err, res) {
    console.log(res.content)
  })

console.log(app.views.articles)

/**
 * Events
 */

var posts = app.create('posts');

posts.on('addView', function (key, value) {
  posts.queue.push(posts.view(key, {content: value}));
  posts.loaded = true;
});

var post = posts.addView('home.html', 'The <%= title %> page');
console.log(posts);
console.log(post);
