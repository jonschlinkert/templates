'use strict';

const assert = require('assert');
const handlebars = require('./support/handlebars');
const Collection = require('../lib/collection');
let pages;

describe('collection.handle', () => {
  beforeEach(function() {
    pages = new Collection('pages', { handlers: ['before', 'after', 'onLoad'] });
    pages.engine('hbs', handlebars(require('handlebars')));
  });

  it('should handle the specified middleware method', () => {
    pages.before(/\.hbs/, file => {
      file.contents = Buffer.from(file.contents.toString() + 'bar');
    });
    pages.after(/\.hbs/, file => {
      file.contents = Buffer.from(file.contents.toString() + 'baz');
    });

    const page = pages.set('a.hbs', { contents: Buffer.from('foo') });
    assert.equal(page.contents.toString(), 'foo');
    pages.handle('before', page);
    assert.equal(page.contents.toString(), 'foobar');
    pages.handle('after', page);
    assert.equal(page.contents.toString(), 'foobarbaz');
  });

  it('should run middleware in series', () => {
    const actual = [];
    function fn(name, n) {
      actual.push(name);
    }

    pages.onLoad('a.hbs', file => fn('onLoad'));
    pages.before('a.hbs', file => fn('before'));
    pages.after('a.hbs', file => fn('after'));

    const page = pages.set('a.hbs', {});
    pages.handle('before', page);
    pages.handle('after', page);

    assert.deepEqual(actual, ['onLoad', 'before', 'after']);
  });
});
