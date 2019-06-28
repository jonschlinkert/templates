'use strict';

const assert = require('assert').strict;
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const App = require('..');
const { Collection } = App;
let pages, layouts;

describe('collection.render', () => {
  beforeEach(function() {
    layouts = new Collection('layouts');
    pages = new Collection('pages');
    pages.engine('hbs', engine(handlebars.create()));
  });

  it('should throw an error when file is not an object', () => {
    return pages.compile()
      .then(() => {
        throw new Error('expected an error');
      })
      .catch(err => {
        assert(err);
        assert(/file/.test(err.message));
      });
  });

  it('should add a file.fn function', async () => {
    const page = await pages.set('about.hbs', { contents: Buffer.from('...') });
    return pages.compile(page)
      .then(file => {
        assert.equal(typeof file.fn, 'function');
        assert.equal(file.fn(), '...');
      });
  });
});
