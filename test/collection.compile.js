'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const handlebars = require('./support/handlebars');
let pages;

describe('collection.render', () => {
  beforeEach(() => {
    pages = new Collection('pages');
    pages.engine('hbs', handlebars(require('handlebars')));
  });

  it('should throw an error when view is not an object', () => {
    assert.throws(() => pages.compile());
  });

  it('should add a view.fn function', () => {
    const page = pages.set('about.hbs', { contents: Buffer.from('...') });
    pages.compile(page);
    assert.equal(typeof page.fn, 'function');
    assert.equal(page.fn(), '...');
  });
});
