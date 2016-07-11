'use strict';

var path = require('path');
var red = require('ansi-red');
var templates = require('./');

templates.on('templates.preInit', function(app) {
  // console.log(app);
});

templates.on('templates.postInit', function(app) {
  // console.log(app);
});


/**
 * Create our `app`
 */

var app = templates();

/**
 * Listen for errors
 */

app.use(function(app) {
  app.on('error', function(err) {
    console.log('app:', red(err));
  });
  return function(collection) {
    collection.on('error', function(err) {
      console.log('collection:', red(err));
    });
    return function(view) {
      view.on('error', function(err) {
        console.log('view:', red(err));
      });
    };
  };
});

/**
 * Engine
 */

app.engine('*', require('engine-base'));
app.engine('html', require('engine-base'));
app.option('engine', '*');

/**
 * Collections and rendering
 */

app.preRender(/./, function(file, next) {
  file.data.title = 'foo';
  next();
});

app.data({title: 'Home'});
app.create('pages')
  .engine('*', require('engine-base'))
  .addView('home', {content: 'The <%= title %> page'})
  .set('locals.title', 'HOOMMMME!')
  .render(function(err, res) {
    if (err) throw err;
    console.log(res.content);
  });

/**
 * Plugins
 */

app.use(function(app) {
  app.section = app.create;
  return function(views) {
    views.on('addView', function() {
      // console.log(views._callbacks)
    });

    // create a custom `.foo()` method on the collection
    views.define('foo', views.addView);
    return function(view) {

      // also add `.foo()` to the view instance for chaining
      view.define('foo', views.foo.bind(views));
    };
  };
});

app.section('articles')
  // this first `.foo` is from the collection instance
  .foo('one.html', {content: 'The <%= title %> page'})
  .set('locals.title', 'One')
  .render(function(err, res) {
    if (err) throw err;
  })

  // this `.foo` is from a `view` instance
  .foo('two.html', {content: 'The <%= title %> page'})
  .set('locals.title', 'Two')
  .render(function(err, res) {
    if (err) throw err;
    // console.log(res.content);
  });

/**
 * Events
 */

var posts = app.create('posts');
posts.engine('html', require('engine-base'));
posts.option('engine', 'html');

var view = posts.addView('home.html', {content: 'The <%= title %> page'})
  .render({title: 'Home'}, function(err, res) {
    if (err) throw err;
    // console.log(res.content);
  });


var collection = app.collection();
collection
  .option('renameKey', function(key) {
    return path.basename(key);
  })
  .addView('foo/bar/baz/a.md', {content: '...'})
  .addView('foo/bar/baz/b.md', {content: '...'})
  .addView('foo/bar/baz/c.md', {content: '...'});

var list = app.list(collection)
// console.log(list)

// console.log(collection.views);
