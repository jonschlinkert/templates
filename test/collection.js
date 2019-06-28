'use strict';

const assert = require('assert').strict;
const App = require('..');
const { Collection } = App;

describe('collection', () => {
  it('should not throw an error when name is not a string', () => {
    assert.doesNotThrow(() => new Collection(), /expected/);
  });

  it('should set the collection.type to renderable by default', () => {
    const pages = new Collection('pages');
    assert.equal(pages.type, 'renderable');
  });

  it('should allow collection.type to be set', () => {
    const pages = new Collection('pages');
    pages.type = 'layout';
    assert.equal(pages.type, 'layout');
  });
});
