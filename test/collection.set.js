'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection.set', () => {
  it('should set a file on collection.files', () => {
    const pages = new Collection('pages');
    pages.set('foo.hbs', {});
    assert(pages.files.has('foo.hbs'));
  });

  it('should set contents when second argument is a string', async () => {
    const pages = new Collection('pages');
    const page = await pages.set('foo.hbs', 'bar');
    assert.equal(page.contents.toString(), 'bar');
  });
});
