'use strict';

const assert = require('assert').strict;
const App = require('..');
const { Collection } = App;

describe('collection.isCollection', () => {
  it('should be true if the value is a collection instance', () => {
    const pages = new Collection('pages');
    assert(Collection.isCollection(pages));
  });

  it('should be false if the value is not a collection instance', () => {
    assert(!Collection.isCollection({}));
    assert(!Collection.isCollection('foo'));
    assert(!Collection.isCollection());
  });
});
