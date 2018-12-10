'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection', () => {
  it('should not throw an error when name is not a string', () => {
    assert.doesNotThrow(() => new Collection(), /expected/);
  });

  it('should set the collection.type to asset by default', () => {
    const pages = new Collection('pages');
    assert.equal(pages.type, 'asset');
  });

  it('should allow collection.type to be set', () => {
    const pages = new Collection('pages');
    pages.type = 'layout';
    assert.equal(pages.type, 'layout');
  });
});
