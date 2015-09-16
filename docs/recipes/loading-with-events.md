# Load collection items from events

Every collection has `addViews` and `addList` methods. Both methods emit an event with the arguments passed to the method before acting upon the arguments. This allows the user to _override or customize how views are actually loaded onto the collection_.

**Loading options**

To load views from an event listener, you must either:

1. Set `collection.loaded = true` after loading the views, or
2. Deplete the items being loaded so that the `addList` and `addViews` methods do not try to double load the items.*

<sup>*</sup>**Note that option #2 is only possible if the value passed is an object or an array.**

### Option #1: deplete the list

**Loading an array**

When you load an array of items using an event listener, you must remove the items from the array so that they aren't double loaded by `collection.addList()` method.


```js
var collection = new Views();

collection.on('addList', function(items) {
  while (items.length) {
    // remove the item so it's not double loaded
    collection.addView({path: items.pop()});
  }
});

collection.addList(['a.txt', 'b.txt', 'c.txt']);
// results in:
// views:
//  { 'c.txt': <View "c.txt">,
//    'b.txt': <View "b.txt">,
//    'a.txt': <View "a.txt"> }
```

**Loading an object**

When you load an object of views using an event listener, you must delete the items from the object so that they aren't double loaded by `collection.addViews()` method.


```js
var collection = new Views();

collection.on('addViews', function (views) {
  for (var key in views) {
    collection.addView('foo/' + key, views[key]);
    // delete the view so it's not double loaded
    delete views[key];
  }
});

collection.addViews({
  a: {path: 'a.txt'},
  b: {path: 'b.txt'},
  c: {path: 'c.txt'}
});

// results in:
// views:
//  { 'foo/a': <View "a.txt">,
//    'foo/b': <View "b.txt">,
//    'foo/c': <View "c.txt"> }
```


### Option #2: set `loaded=true`

Your second option, with either an array or object, is to explicitly signal that you're finished loading.

```js
var collection = new Views();

collection.on('addList', function(items) {
  items.forEach(function(item) {
    collection.addView({path: item});
  });
  collection.loaded = true;
});

collection.addList(['a.txt', 'b.txt', 'c.txt']);
// results in:
// views:
//  { 'c.txt': <View "c.txt">,
//    'b.txt': <View "b.txt">,
//    'a.txt': <View "a.txt"> }
```
