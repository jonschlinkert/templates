---
title: Collections
---

Collections offer a way of organizing views into logical groups. Beyond that, collections can also provide control over how views will be loaded, rendered, default settings used for each view, an so on.

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
