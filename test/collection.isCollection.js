'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection.isCollection', function() {
  it('should be true if the value is a collection instance', function() {
    const pages = new Collection('pages');
    assert(Collection.isCollection(pages));
  });

  it('should be false if the value is not a collection instance', function() {
    assert(!Collection.isCollection({}));
    assert(!Collection.isCollection('foo'));
    assert(!Collection.isCollection());
  });
});
