'use strict';

const assert = require('assert').strict;
const App = require('..');
const { Collection } = App;

describe('collection.handlers', () => {
  it('should add handler methods after instantiation', () => {
    const pages = new Collection('pages');
    pages.handlers(['before', 'after']);

    assert.equal(typeof pages.all, 'function');
    assert.equal(typeof pages.before, 'function');
    assert.equal(typeof pages.after, 'function');
  });
});
