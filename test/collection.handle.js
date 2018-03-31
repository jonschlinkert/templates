'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const engines = require('./support/engines');
let pages, layouts;

describe('collection.handle', function() {
  beforeEach(function() {
    pages = new Collection('pages', { handlers: ['before', 'after', 'onLoad'] });
    pages.engine('hbs', engines.handlebars(require('handlebars')));
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

    pages.onLoad('a.hbs', file => {
      return new Promise(resolve => {
        setTimeout(function() {
          actual.push('onLoad');
          resolve();
        }, 10);
      });
    });

    pages.before('a.hbs', file => {
      return new Promise(resolve => {
        setTimeout(function() {
          actual.push('before');
          resolve();
        }, 5);
      });
    });

    pages.after('a.hbs', file => {
      return new Promise(resolve => {
        setTimeout(function() {
          actual.push('after');
          resolve();
        }, 1);
      });
    });

    const page = await pages.set('a.hbs', {});
    await pages.handle('before', page);
    await pages.handle('after', page);

    assert.deepEqual(actual, ['onLoad', 'before', 'after']);
    return page;
  });
});
