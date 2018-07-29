'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection', () => {
  it('should not throw an error when name is not a string', () => {
    assert.doesNotThrow(() => new Collection(), /expected/);
  });

  it('should set the collection.kind to renderable by default', () => {
    const pages = new Collection('pages');
    assert.equal(pages.kind, 'renderable');
  });

  it('should allow collection.kind to be set', () => {
    const pages = new Collection('pages');
    pages.kind = 'layout';
    assert.equal(pages.kind, 'layout');
  });
});
