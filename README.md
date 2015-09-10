# templates [![NPM version](https://badge.fury.io/js/templates.svg)](http://badge.fury.io/js/templates)

> System for creating and managing template collections, and rendering templates with any node.js template engine. Can be used as the basis for creating a static site generator or blog framework.

## Install

Install with [npm](https://www.npmjs.com/)

```sh
$ npm i templates --save
```

## Usage

```js
var templates = require('templates');
```

## API

### [Templates](index.js#L32)

This function is the main export of the templates module. Initialize an instance of `templates` to create your application.

**Params**

* `options` **{Object}**

**Example**

```js
var templates = require('templates');
var app = templates();
```

### [.create](index.js#L153)

Create a view collection. View collections are stored on the `app.views` object. For example, if you create a collection named `posts`, the all `posts` will be stored on `app.views.posts`.

**Params**

* `name` **{String}**: The name of the collection. Plural or singular form.
* `opts` **{Object}**: Collection options
* `loaders` **{String|Array|Function}**: Loaders to use for adding views to the created collection.
* `returns` **{Object}**: Returns the `Template` instance for chaining.

**Example**

```js
app.create('posts');
app.posts({...}); // add an object of views
app.post('foo', {content: '...'}); // add a single view

// collection methods are chainable too
app.post('home.hbs', {content: 'foo <%= title %> bar'})
  .render({title: 'Home'}, function(err, res) {
    //=> 'foo Home bar'
  });
```

### [.find](index.js#L300)

Find a view by `name`, optionally passing a `collection` to limit the search. If no collection is passed all `renderable` collections will be searched.

**Params**

* `name` **{String}**: The name/key of the view to find
* `colleciton` **{String}**: Optionally pass a collection name (e.g. pages)
* `returns` **{Object|undefined}**: Returns the view if found, or `undefined` if not.

**Example**

```js
var page = app.find('my-page.hbs');

// optionally pass a collection name as the second argument
var page = app.find('my-page.hbs', 'pages');
```

### [.getView](index.js#L338)

Get view `key` from the specified `collection`.

**Params**

* `collection` **{String}**: Collection name, e.g. `pages`
* `key` **{String}**: Template name
* `fn` **{Function}**: Optionally pass a `renameKey` function
* `returns` **{Object}**

**Example**

```js
var view = app.getView('pages', 'a/b/c.hbs');

// optionally pass a `renameKey` function to modify the lookup
var view = app.getView('pages', 'a/b/c.hbs', function(fp) {
  return path.basename(fp);
});
```

### [.getViews](index.js#L377)

Get all views from a `collection` using the collection's singular or plural name.

**Params**

* `name` **{String}**: The collection name, e.g. `pages` or `page`
* `returns` **{Object}**

**Example**

```js
var pages = app.getViews('pages');
//=> { pages: {'home.hbs': { ... }}

var posts = app.getViews('posts');
//=> { posts: {'2015-10-10.md': { ... }}
```

### [.matchView](index.js#L409)

Returns the first view from `collection` with a key that matches the given glob pattern.

**Params**

* `collection` **{String}**: Collection name.
* `pattern` **{String}**: glob pattern
* `options` **{Object}**: options to pass to [micromatch](https://github.com/jonschlinkert/micromatch)
* `returns` **{Object}**

**Example**

```js
var pages = app.matchView('pages', 'home.*');
//=> {'home.hbs': { ... }, ...}

var posts = app.matchView('posts', '2010-*');
//=> {'2015-10-10.md': { ... }, ...}
```

### [.matchViews](index.js#L437)

Returns any views from the specified collection with keys that match the given glob pattern.

**Params**

* `collection` **{String}**: Collection name.
* `pattern` **{String}**: glob pattern
* `options` **{Object}**: options to pass to [micromatch](https://github.com/jonschlinkert/micromatch)
* `returns` **{Object}**

**Example**

```js
var pages = app.matchViews('pages', 'home.*');
//=> {'home.hbs': { ... }, ...}

var posts = app.matchViews('posts', '2010-*');
//=> {'2015-10-10.md': { ... }, ...}
```

### [.handle](index.js#L479)

Handle a middleware `method` for `view`.

**Params**

* `method` **{String}**: Name of the router method to handle. See [router methods](./docs/router.md)
* `view` **{Object}**: View object
* `callback` **{Function}**: Callback function
* `returns` **{Object}**

**Example**

```js
app.handle('customMethod', view, callback);
```

See the [route API documentation][route-api] for details on
adding handlers and middleware to routes.

**Params**

* `path` **{String}**
* `returns` **{Object}** `Route`: for chaining

**Example**

```js
app.create('posts');
app.route(/blog/)
  .all(function(view, next) {
    // do something with view
    next();
  });

app.post('whatever', {path: 'blog/foo.bar', content: 'bar baz'});
```

### [.all](index.js#L589)

Special route method that works just like the `router.METHOD()` methods, except that it matches all verbs.

**Params**

* `path` **{String}**
* `callback` **{Function}**
* `returns` **{Object}** `this`: for chaining

**Example**

```js
app.all(/\.hbs$/, function(view, next) {
  // do stuff to view
  next();
});
```

### [.param](index.js#L618)

Add callback triggers to route parameters, where `name` is the name of the parameter and `fn` is the callback function.

**Params**

* `name` **{String}**
* `fn` **{Function}**
* `returns` **{Object}**: Returns the instance of `Templates` for chaining.

**Example**

```js
app.param('title', function (view, next, title) {
  //=> title === 'foo.js'
  next();
});

app.onLoad('/blog/:title', function (view, next) {
  //=> view.path === '/blog/foo.js'
  next();
});
```

**Params**

* `exts` **{String|Array}**: String or array of file extensions.
* `fn` **{Function|Object}**: or `settings`
* `settings` **{Object}**: Optionally pass engine options as the last argument.

**Example**

```js
app.engine('hbs', require('engine-handlebars'));

// using consolidate.js
var engine = require('consolidate');
app.engine('jade', engine.jade);
app.engine('swig', engine.swig);

// get a registered engine
var swig = app.engine('swig');
```

### [.compile](index.js#L784)

Compile `content` with the given `locals`.

**Params**

* `view` **{Object|String}**: View object.
* `locals` **{Object}**
* `isAsync` **{Boolean}**: Load async helpers
* `returns` **{Object}**: View object with `fn` property with the compiled function.

**Example**

```js
var indexPage = app.page('some-index-page.hbs');
var view = app.compile(indexPage);
// view.fn => [function]

// you can call the compiled function more than once
// to render the view with different data
view.fn({title: 'Foo'});
view.fn({title: 'Bar'});
view.fn({title: 'Baz'});
```

### [.render](index.js#L843)

Render a view with the given `locals` and `callback`.

**Params**

* `view` **{Object|String}**: Instance of `View`
* `locals` **{Object}**: Locals to pass to template engine.
* `callback` **{Function}**

**Example**

```js
var blogPost = app.post.getView('2015-09-01-foo-bar');
app.render(blogPost, {title: 'Foo'}, function(err, view) {
  // `view` is an object with a rendered `content` property
});
```

## Related projects

* [assemble](https://www.npmjs.com/package/assemble): Static site generator for Grunt.js, Yeoman and Node.js. Used by Zurb Foundation, Zurb Ink, H5BP/Effeckt,… [more](https://www.npmjs.com/package/assemble) | [homepage](http://assemble.io)
* [en-route](https://www.npmjs.com/package/en-route): Routing for static site generators, build systems and task runners, heavily based on express.js routes… [more](https://www.npmjs.com/package/en-route) | [homepage](https://github.com/jonschlinkert/en-route)
* [engine](https://www.npmjs.com/package/engine): Template engine based on Lo-Dash template, but adds features like the ability to register helpers… [more](https://www.npmjs.com/package/engine) | [homepage](https://github.com/jonschlinkert/engine)
* [layouts](https://www.npmjs.com/package/layouts): Wraps templates with layouts. Layouts can use other layouts and be nested to any depth.… [more](https://www.npmjs.com/package/layouts) | [homepage](https://github.com/doowb/layouts)
* [template](https://www.npmjs.com/package/template): Render templates using any engine. Supports, layouts, pages, partials and custom template types. Use template… [more](https://www.npmjs.com/package/template) | [homepage](https://github.com/jonschlinkert/template)
* [verb](https://www.npmjs.com/package/verb): Documentation generator for GitHub projects. Verb is extremely powerful, easy to use, and is used… [more](https://www.npmjs.com/package/verb) | [homepage](https://github.com/verbose/verb)

## Running tests

Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/templates/issues/new).

## Author

**Jon Schlinkert**

+ [github/jonschlinkert](https://github.com/jonschlinkert)
+ [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2015 Jon Schlinkert
Released under the MIT license.

***

_This file was generated by [verb-cli](https://github.com/assemble/verb-cli) on September 10, 2015._