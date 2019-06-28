'use strict';

const path = require('path');
const assert = require('assert').strict;
const App = require('..');
const { Collection } = App;

describe('collection.get', () => {
  it('should find a file on collection.files', () => {
    const pages = new Collection('pages');
    pages.set('foo.hbs', {});
    const page = pages.find(file => file.stem === 'foo');
    assert.equal(page.path, 'foo.hbs');
  });

  it('should not throw an error when a file does not exist', () => {
    const pages = new Collection('pages');
    pages.set('bar.hbs', {});
    const page = pages.find(file => file.stem === 'foo');
    assert.equal(page, undefined);
  });
});
