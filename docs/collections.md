---
title: Collections
---

Collections offer a way of organizing views into logical groups. Beyond that, collections can also provide control over how views will be loaded, rendered, the default settings to be used for each item added to the collection, and so on.


TODO:

```js
app.Collection;
app.Views;
app.collection();
app.viewCollection();
app.create()
```


**Heads up!**

Examples assume the following code exists:

```js
var templates = require('templates');
var app = templates();
```

## Creating collections

**Quickstart**

The easiest and most common way to create a new collection is with the `.create()` method.

```js
// create a "pages" collection
app.create('pages');
```

Depending on your needs, there a few different ways to create a collection, the most common are:

- `app.create()`
- `app.collection()`

```js
var collection = app.collection();
collection.addViews({...}); // add an object of views
collection.addView('foo', {content: '...'}); // add a single view

// collection methods are chainable too
collection.addView('home.hbs', {content: 'foo <%= title %> bar'})
  .render({title: 'Home'}, function(err, res) {
    //=> 'foo Home bar'
  });
```

## view collections

## create

Create a new view collection to be stored on the `app.views` object. For example, if you create a collection named `posts`:

- all `posts` will be stored on `app.views.posts`
- a `post` method will be added to `app`, allowing you to add a single view to the `posts` collection using `app.post()` (equivalent to `collection.addView()`)
- a `posts` method will be added to `app`, allowing you to add views to the `posts` collection using `app.posts()` (equivalent to `collection.addViews()`)

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


