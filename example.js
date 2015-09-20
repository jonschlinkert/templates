var templates = require('./');
var app = templates();
var green = require('ansi-green');
var yellow = require('ansi-yellow');
var red = require('ansi-red');

app.use(function (app) {
  app.on('error', function (err) {
    console.log('app:', red(err));
  });
  return function (collection) {
    collection.on('error', function (err) {
      console.log('collection:', red(err));
    });
    return function (view) {
      view.on('error', function (err) {
        console.log('view:', red(err));
      });
    };
  };
});

/**
 * Engine
 */

app.engine('*', require('engine-base'));
app.option('view engine', '*');

/**
 * Collections and rendering
 */

app.create('pages')
  .addView('home', {content: 'The <%= title %> page'})
  .set('locals.title', 'HOOMMMME!')
  .render(function (err, res) {
    if (err) return console.log(err);
    // console.log(res.content);
  })

/**
 * Plugins
 */

app.use(function (app) {
  app.section = app.create;
  return function (views) {
    views.on('addView', function () {
      // console.log(views._callbacks)
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
    if (err) return console.log(err.stack);
  })
  // this `.foo` is from a `view` instance
  .foo('two.html', {content: 'The <%= title %> page'})
  .set('locals.title', 'Two')
  .render(function (err, res) {
    if (err) return console.log(err.stack)
  })

// console.log(app.views.articles)

/**
 * Events
 */

var posts = app.create('posts');
var engine = app.engine('*');
posts.engine('html', engine);

posts.on('error', function (err) {
  if (err) return console.log(err)
})

posts.preCompile(/./, function (view, next) {
  view.engine = 'html';
  // console.log(view)
  next();
});

posts.on('addView', function (key, value) {
  posts.queue.push(posts.view(key, {content: value}));
  posts.loaded = true;
});

var post = posts.addView('home.html', 'The <%= title %> page');
// console.log(posts);
// console.log(post);

posts.render('home.html', {title: 'Home'}, function (err, res) {
  // if (err) return console.log(err.stack);
});
