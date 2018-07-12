'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection', function() {
  it('should not throw an error when name is not a string', function() {
    assert.doesNotThrow(() => new Collection(), /expected/);
  });

  it('should set the collection.kind to renderable by default', function() {
    const pages = new Collection('pages');
    assert.equal(pages.kind, 'renderable');
  });

  it('should allow collection.kind to be set', function() {
    const pages = new Collection('pages');
    pages.kind = 'layout';
    assert.equal(pages.kind, 'layout');
  });
});
