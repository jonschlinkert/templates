'use strict';

const assert = require('assert').strict;
const App = require('..');
const { Collection } = App;
let app;

describe('app.create', () => {
  beforeEach(() => {
    app = new App();
  });

  it('should return a new collection', () => {
    const pages = app.create('pages');
    assert(pages instanceof Collection);
  });

  it('should emit "collection"', cb => {
    app.on('collection', () => cb());
    app.create('pages');
  });
});
