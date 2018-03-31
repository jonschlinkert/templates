'use strict';

const path = require('path');
const App = require('..');
const app = new App();

app.create('pages');
app.create('partials', { type: 'partial' });

app.on('view', function(view, type) {
  console.log('view:', type || 'collection', '>', view);
});

app.on('page', function(view) {
  console.log('page >', view);
  //=> <Page "a" <Buffer 74 68 69 73 20 69 73 20 61>>
});

app.on('partial', function(view) {
  console.log('partial >', view);
  //=> <Partial "foo" <Buffer 74 68 69 73 20 69 73 20 66 6f 6f>>
});

app.pages.set('a', { content: 'this is a' });
app.pages.set('b', { content: 'this is b' });
app.pages.set('c', { content: 'this is c' });

app.partials.set('foo', { content: 'this is foo' });
app.partials.set('bar', { content: 'this is bar' });
app.partials.set('baz', { content: 'this is baz' });

// create an unnamed collection
const collection = app.collection();

collection.set('a', 'this is a');
collection.set('b', 'this is b');
collection.set('c', 'this is c');
console.log(collection);
