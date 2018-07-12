'use strict';

const path = require('path');
const assert = require('assert');
const Collection = require('../lib/collection');

describe('collection.delete', function() {
  it('should delete a view', function() {
    const pages = new Collection('pages');
    const fp = path.resolve(__dirname, 'foo.hbs');
    pages.set(fp, {});
    assert.equal(pages.get('test/foo.hbs').path, fp);

    pages.delete(fp);
    assert.equal(pages.get('test/foo.hbs'), undefined);
  });

  it('should ignore views that do not exist on the collection', function() {
    const pages = new Collection('pages');
    assert.doesNotThrow(() => pages.delete('flsjfklsfklsfsj'));
  });
});
