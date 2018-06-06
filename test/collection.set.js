'use strict';

const path = require('path');
const assert = require('assert');
const Collection = require('../lib/collection');
let pages;

describe('collection.set', function() {
  it('should set a view on collection.views', function() {
    const pages = new Collection('pages');
    pages.set('foo.hbs', {});
    assert(pages.views.has('foo.hbs'));
  });

  it('should set contents when second argument is a string', function() {
    const pages = new Collection('pages');
    const page = pages.set('foo.hbs', 'bar');
    assert.equal(page.contents.toString(), 'bar');
  });

  it('should run plugins on views', function() {
    const pages = new Collection('pages');
    pages.use(function fn() {
      this.foo = 'bar';
      return fn;
    });

    const page = pages.set('foo.hbs', 'bar');
    assert.equal(pages.foo, 'bar');
    assert.equal(page.foo, 'bar');
  });
});
