'use strict';

const path = require('path');
const assert = require('assert');
const Collection = require('../lib/collection');
let pages;

describe('collection.get', function() {
  it('should get a view from collection.views', function() {
    const pages = new Collection('pages');
    pages.set('foo.hbs', {});
    const page = pages.get('foo.hbs');
    assert.equal(page.path, 'foo.hbs');
  });

  it('should get a view from collection.views', function() {
    const pages = new Collection('pages');
    const fp = path.resolve(__dirname, 'foo.hbs');
    pages.set(fp, {});
    const page = pages.get('test/foo.hbs');
    assert.equal(page.path, fp);
  });

  it('should be undefined when view does not exist', function() {
    const pages = new Collection('pages');
    const page = pages.get('test/foo.hbs');
    assert.equal(page, undefined);
  });
});
