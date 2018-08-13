'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection.get', () => {
  it('should find a view on collection.views', () => {
    const pages = new Collection('pages');
    pages.set('foo.hbs', {});
    const page = pages.find(file => file.stem === 'foo');
    assert.equal(page.path, 'foo.hbs');
  });

  it('should not throw an error when a view does not exist', () => {
    const pages = new Collection('pages');
    pages.set('bar.hbs', {});
    const page = pages.find(file => file.stem === 'foo');
    assert.equal(page, undefined);
  });
});
