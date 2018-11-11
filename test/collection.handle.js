'use strict';

const assert = require('assert');
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const Collection = require('../lib/collection');
let pages, layouts;

describe('collection.handle', () => {
  beforeEach(function() {
    pages = new Collection('pages', { handlers: ['before', 'after', 'onLoad'] });
    pages.engine('hbs', engine(handlebars.create()));
  });

  it('should handle the specified middleware method', async() => {
    pages.before(/\.hbs/, file => {
      file.contents = Buffer.from(file.contents.toString() + 'bar');
    });
    pages.after(/\.hbs/, file => {
      file.contents = Buffer.from(file.contents.toString() + 'baz');
    });

    const page = await pages.set('a.hbs', { contents: Buffer.from('foo') });
    assert.equal(page.contents.toString(), 'foo');
    pages.handle('before', page);
    assert.equal(page.contents.toString(), 'foobar');
    pages.handle('after', page);
    assert.equal(page.contents.toString(), 'foobarbaz');
  });

  it('should run middleware in series by default', async() => {
    const actual = [];
    function fn(name, n) {
      return new Promise(resolve => {
        setTimeout(function() {
          actual.push(name);
          resolve();
        }, n);
      });
    }

    pages.onLoad('a.hbs', file => fn('onLoad', 10));
    pages.before('a.hbs', file => fn('before', 5));
    pages.after('a.hbs', file => fn('after', 1));

    const page = await pages.set('a.hbs', {});
    await pages.handle('before', page);
    await pages.handle('after', page);

    assert.deepEqual(actual, ['onLoad', 'before', 'after']);
    return page;
  });
});
