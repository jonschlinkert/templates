'use strict';

const path = require('path');
const assert = require('assert').strict;
const App = require('..');
const { Collection } = App;

describe('collection.delete', () => {
  it('should delete a file', () => {
    const pages = new Collection('pages');
    const fp = path.resolve(__dirname, 'foo.hbs');
    pages.set(fp, {});
    assert.equal(pages.get('test/foo.hbs').path, fp);

    pages.delete(fp);
    assert.equal(pages.get('test/foo.hbs'), undefined);
  });

  it('should ignore files that do not exist on the collection', () => {
    const pages = new Collection('pages');
    assert.doesNotThrow(() => pages.delete('flsjfklsfklsfsj'));
  });
});
