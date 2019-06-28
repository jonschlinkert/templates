'use strict';

const assert = require('assert').strict;
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const App = require('..');
let app;

describe('app.renderSync', () => {
  beforeEach(function() {
    app = new App({ sync: true });
    app.engine('hbs', engine(handlebars.create()));
    app.create('layouts', { type: 'layout' });
    app.create('pages', { type: 'renderable' });
  });

  describe('rendering', () => {
    it('should throw an error when file is not an object', () => {
      assert.throws(() => app.render());
    });

    it('should throw an error when an engine is not defined:', () => {
      app.engines.delete('.hbs');
      let page = app.pages.set('foo.bar', { contents: Buffer.from('<%= name %>') });

      assert.throws(() => app.render(page));
    });

    it('should support using helpers to render a file:', () => {
      app.helper('upper', str => str.toUpperCase(str));

      let page = app.pages.set('a.hbs', {
        contents: Buffer.from('a {{upper name}} b'),
        data: { name: 'Brian' }
      });

      app.render(page);
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });

    it('should use globally defined data to render a file', () => {
      app.cache.data.name = 'Brian';
      app.helper('upper', str => str.toUpperCase(str));

      let page = app.pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b') });
      app.render(page);
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });

    it('should render a file from its path:', () => {
      app.helper('upper', str => str.toUpperCase(str));
      let page = app.pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });

      app.render('a.hbs');
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });
  });

  describe('layouts', () => {
    it('should throw an error when a layout cannot be found', () => {
      let file = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'missing' });

      assert.throws(() => app.render(file), /layout "missing"/);
    });

    it('should render get layouts from render locals', () => {
      app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      let file = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      app.render(file, { layouts: app.layouts.files });
      assert.equal(file.contents.toString(), 'before This is content after');
    });

    it('should render get layouts from render options', () => {
      app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      let file = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      app.render(file, null, { layouts: app.layouts.files });
      assert.equal(file.contents.toString(), 'before This is content after');
    });

    it('should get layouts from app.types.layouts', () => {
      app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      let file = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      app.render(file);
      assert.equal(file.contents.toString(), 'before This is content after');
    });

    it('should throw an error when a layout cannot be found on app.types.layout', () => {
      app.layouts.set('fsjfsjslkjf.hbs', { contents: Buffer.from('before {% body %} after') });

      let file = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      assert.throws(() => app.render(file), /layout "default"/);
    });
  });
});
