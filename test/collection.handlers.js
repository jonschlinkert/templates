'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection.handlers', () => {
  it('should add handler methods after instantiation', () => {
    const pages = new Collection('pages');
    pages.handlers(['before', 'after']);

    assert.equal(typeof pages.all, 'function');
    assert.equal(typeof pages.before, 'function');
    assert.equal(typeof pages.after, 'function');
  });
});
