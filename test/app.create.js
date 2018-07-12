'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const App = require('..');
let app;

describe('app.create', function() {
  beforeEach(function() {
    app = new App();
  });

  it('should return a new collection', function() {
    const pages = app.create('pages');
    assert(pages instanceof Collection);
  });

  it('should emit "collection"', function(cb) {
    app.on('collection', () => cb());
    app.create('pages');
  });
});
