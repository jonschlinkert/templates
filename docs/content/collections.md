---
title: Collections
---


```js
const collection = new Collection();
```

Creating collections

```js
const pages = new Collection('pages');
const pages = app.collection('pages');
const pages = app.create('pages');
// pages === app.pages
```

Using collections

```js
const pages = app.create('pages');
pages.set('foo.hbs', { contents: Buffer.from('this is contents') });


app.create('pages');
app.pages.set('foo.hbs', { contents: Buffer.from('this is contents') });
```
