'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const engine = require('engine-handlebars');
let pages, layouts;

describe('collection.render', () => {
  beforeEach(function() {
    layouts = new Collection('layouts');
    pages = new Collection('pages', { asyncHelpers: true });
    pages.engine('hbs', engine(require('handlebars')));
  });

  describe('rendering', () => {
    it('should throw an error when file is not an object', () => {
      return pages.render()
        .then(() => {
          throw new Error('expected an error');
        })
        .catch(err => {
          assert(err);
          assert(/file/.test(err.message));
        });
    });

    it('should throw an error when an engine is not defined:', () => {
      pages.set('foo.bar', { contents: Buffer.from('<%= name %>') });
      pages.engines.delete('.hbs');

      const page = pages.get('foo.bar');

      return pages.render(page)
        .then(() => {
          throw new Error('expected an error');
        })
        .catch(err => {
          assert(err);
          assert(/engine "bar" is not registered/.test(err.message));
        });
    });

    it('should support using helpers to render a file:', async() => {
      pages.helper('upper', str => str.toUpperCase(str));
      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });
      const page = pages.get('a.hbs');
      const file = await pages.render(page);
      assert.equal(file.contents.toString(), 'a BRIAN b');
    });

    it('should support using async helpers to render a file:', async() => {
      pages.helper('upper', function(str) {
        return new Promise(resolve => {
          setTimeout(() => resolve(str.toUpperCase(str)), 10);
        });
      });

      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });
      const page = pages.get('a.hbs');
      const file = await pages.render(page);
      assert.equal(file.contents.toString(), 'a BRIAN b');
    });

    it('should use globally defined data to render a file', async() => {
      pages.cache.data.name = 'Brian';
      pages.helper('upper', str => str.toUpperCase(str));

      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b') });
      const page = pages.get('a.hbs');
      const file = await pages.render(page);
      assert.equal(file.contents.toString(), 'a BRIAN b');
    });

    it('should render a file from its path:', async() => {
      pages.helper('upper', str => str.toUpperCase(str));
      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });

      const file = await pages.render('a.hbs');
      assert.equal(file.contents.toString(), 'a BRIAN b');
    });
  });

  describe('layouts', () => {
    it('should throw an error when a layout cannot be found', async() => {
      const file = await pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      return pages.render(file)
        .catch(err => {
          assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
        });
    });

    it('should render a file with a layout defined', async() => {
      layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      const file = await pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      await pages.render(file, { layouts: layouts.files });
      assert.equal(file.contents.toString(), 'before This is content after');
    });
  });
});
