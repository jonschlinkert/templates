'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const engines = require('../lib/engines');
let pages, layouts;

describe('collection.render', function() {
  beforeEach(function() {
    layouts = new Collection('layouts');
    pages = new Collection('pages');
    pages.engine('hbs', engines(require('handlebars')));
  });

  describe('rendering', function() {
    it('should throw an error when view is not an object', function() {
      assert.throws(() => pages.render());
    });

    it('should throw an error when an engine is not defined:', function() {
      pages.set('foo.bar', { contents: Buffer.from('<%= name %>') });
      pages.engines.delete('.hbs');

      const page = pages.get('foo.bar');
      assert.throws(() => pages.render(page));
    });

    it('should support using helpers to render a view:', () => {
      pages.helper('upper', str => str.toUpperCase(str));
      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });
      const page = pages.get('a.hbs');
      const view = pages.render(page);
      assert.equal(view.contents.toString(), 'a BRIAN b');
    });

    it('should use globally defined data to render a view', () => {
      pages.cache.data.name = 'Brian';
      pages.helper('upper', str => str.toUpperCase(str));

      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b') });
      const page = pages.get('a.hbs');
      const view = pages.render(page);
      assert.equal(view.contents.toString(), 'a BRIAN b');
    });

    it('should render a view from its path:', () => {
      pages.helper('upper', str => str.toUpperCase(str));
      pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });

      const view = pages.render('a.hbs');
      assert.equal(view.contents.toString(), 'a BRIAN b');
    });
  });

  describe('layouts', function() {
    it('should throw an error when a layout cannot be found', () => {
      const view = pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      assert.throws(() => pages.render(view), /layout "default" is defined on "a.hbs" but cannot be found/);
    });

    it('should render a view with a layout defined', () => {
      layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      const view = pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      pages.render(view, { layouts: layouts.views });
      assert.equal(view.contents.toString(), 'before This is content after');
    });
  });
});
