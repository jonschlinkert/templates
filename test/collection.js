'use strict';

const path = require('path');
const assert = require('assert');
const Collection = require('../lib/collection');
let pages;

describe('collection', function() {
  it('should not throw an error when name is not a string', function() {
    assert.doesNotThrow(() => new Collection(), /expected/);
  });

  it('should set the collection.type to renderable by default', function() {
    const pages = new Collection('pages');
    assert.equal(pages.type, 'renderable');
  });

  it('should allow collection.type to be set', function() {
    const pages = new Collection('pages');
    pages.type = 'layout';
    assert.equal(pages.type, 'layout');
  });
});
