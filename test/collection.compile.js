'use strict';

const assert = require('assert');
const handlebars = require('handlebars');
const Collection = require('../lib/collection');
const engines = require('../lib/engines');
let pages, layouts;

describe('collection.render', () => {
  beforeEach(function() {
    layouts = new Collection('layouts');
    pages = new Collection('pages');
    pages.engine('hbs', engines(handlebars.create()));
  });

  it('should throw an error when view is not an object', () => {
    return pages.compile()
      .then(() => {
        throw new Error('expected an error');
      })
      .catch(err => {
        assert(err);
        assert(/view/.test(err.message));
      });
  });

  it('should add a view.fn function', async () => {
    const page = await pages.set('about.hbs', { contents: Buffer.from('...') });
    return pages.compile(page)
      .then(view => {
        assert.equal(typeof view.fn, 'function');
        assert.equal(view.fn(), '...');
      });
  });
});
