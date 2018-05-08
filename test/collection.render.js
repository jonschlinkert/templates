'use strict';

const assert = require('assert');
const handlebars = require('./support/handlebars');
const Collection = require('../lib/collection');
const engines = require('./support/engines');
let pages, layouts;

describe('collection.render', function() {
  beforeEach(function() {
    layouts = new Collection('layouts');
    pages = new Collection('pages', { asyncHelpers: true });
    pages.engine('hbs', handlebars(require('handlebars')));
  });

  describe('rendering', function() {
    it('should throw an error when view is not an object', function() {
      return pages.render()
        .then(() => {
          throw new Error('expected an error');
        })
        .catch(err => {
          assert(err);
          assert(/view/.test(err.message));
        });
    });

    it('should throw an error when an engine is not defined:', function() {
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

    it('should support using helpers to render a view:', async() => {
      pages.helper('upper', str => str.toUpperCase(str));
      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });
      const page = pages.get('a.hbs');
      const view = await pages.render(page);
      assert.equal(view.contents.toString(), 'a BRIAN b');
    });

    it('should support using async helpers to render a view:', async() => {
      pages.helper('upper', function(str) {
        return new Promise(resolve => {
          setTimeout(() => resolve(str.toUpperCase(str)), 10);
        });
      });

      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });
      const page = pages.get('a.hbs');
      const view = await pages.render(page);
      assert.equal(view.contents.toString(), 'a BRIAN b');
    });

    it('should use globally defined data to render a view', async() => {
      pages.cache.data.name = 'Brian';
      pages.helper('upper', str => str.toUpperCase(str));

      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b') });
      const page = pages.get('a.hbs');
      const view = await pages.render(page);
      assert.equal(view.contents.toString(), 'a BRIAN b');
    });

    it('should render a view from its path:', async() => {
      pages.helper('upper', str => str.toUpperCase(str));
      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });

      const view = await pages.render('a.hbs');
      assert.equal(view.contents.toString(), 'a BRIAN b');
    });
  });

  describe('layouts', function() {
    it('should throw an error when a layout cannot be found', async() => {
      const view = await pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      return pages.render(view)
        .catch(err => {
          assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
        });
    });

    it('should render a view with a layout defined', async() => {
      layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      const view = await pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      await pages.render(view, { layouts: layouts.views });
      assert.equal(view.contents.toString(), 'before This is content after');
    });
  });
});
