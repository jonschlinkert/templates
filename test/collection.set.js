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

  it('should set contents when second argument is a string', async function() {
    const pages = new Collection('pages');
    const page = await pages.set('foo.hbs', 'bar');
    assert(page.contents.toString(), 'bar');
  });
});
