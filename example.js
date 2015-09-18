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

    // create a custom `.add()` method
    // on the collection
    views.add = views.addView;
    return function (view) {

      // also add `.add()` to the view instance for chaining
      view.add = views.add.bind(views);
    };
  };
});

app.section('articles')
  .add('one.html', {content: 'The <%= title %> page'})
  .set('locals.title', 'One')
  .render(function (err, res) {
    console.log(res.content)
  })
  .add('two.html', {content: 'The <%= title %> page'})
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

posts.addView('home.html', 'The <%= title %> page');
console.log(posts.views);
