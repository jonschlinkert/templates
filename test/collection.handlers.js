'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
let pages;

describe('collection.handlers', function() {
  it('should add handler methods after instantiation', function() {
    const pages = new Collection('pages');
    pages.handlers(['before', 'after']);

    assert.equal(typeof pages.all, 'function');
    assert.equal(typeof pages.before, 'function');
    assert.equal(typeof pages.after, 'function');
  });
});
