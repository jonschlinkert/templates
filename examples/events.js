'use strict';

const path = require('path');
const App = require('..');
const app = new App();

app.create('pages');
app.create('partials', { type: 'partial' });

app.on('page', file => console.log('page >', file));
app.on('partial', file => console.log('partial >', file));
app.on('file', function(file, type) {
  console.log('file:', type || 'collection', '>', file);
});

app.pages.set('a', { content: 'this is a' });
app.pages.set('b', { content: 'this is b' });
app.pages.set('c', { content: 'this is c' });

app.partials.set('foo', { content: 'this is foo' });
app.partials.set('bar', { content: 'this is bar' });
app.partials.set('baz', { content: 'this is baz' });

// uncached collection
const collection = app.collection();
collection.set('a', 'this is a');
collection.set('b', 'this is b');
collection.set('c', 'this is c');
// console.log(collection);
