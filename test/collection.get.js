'use strict';

const path = require('path');
const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection.get', () => {
  it('should get a file from collection.files', () => {
    const pages = new Collection('pages');
    pages.set('foo.hbs', {});
    const page = pages.get('foo.hbs');
    assert.equal(page.path, 'foo.hbs');
  });

  it('should get a file from collection.files', () => {
    const pages = new Collection('pages');
    const fp = path.resolve(__dirname, 'foo.hbs');
    pages.set(fp, {});
    const page = pages.get('test/foo.hbs');
    assert.equal(page.path, fp);
  });

  it('should be undefined when file does not exist', () => {
    const pages = new Collection('pages');
    const page = pages.get('test/foo.hbs');
    assert.equal(page, undefined);
  });
});
