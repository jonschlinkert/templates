'use strict';

const assert = require('assert');
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const App = require('..');
let app;

describe('app.layouts', () => {
  beforeEach(function() {
    app = new App();
    app.create('layouts', { kind: 'layout' });
    app.create('pages');
    app.engine('hbs', engine(handlebars.create()));
  });

  describe('layouts', () => {
    it('should throw an error when a layout cannot be found', async() => {
      const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      return app.render(file)
        .catch(err => {
          assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
        });
    });

    it('should get layouts from render locals', async() => {
      app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      await app.render(file, { layouts: app.layouts.files });
      assert.equal(file.contents.toString(), 'before This is content after');
    });

    it('should get layouts from render options', async() => {
      app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      await app.render(file, { layouts: app.layouts.files });
      assert.equal(file.contents.toString(), 'before This is content after');
    });

    it('should get layouts from app.kinds.layouts', async() => {
      app.layouts.set('bar.hbs', { contents: Buffer.from('before {% body %} after') });
      app.layouts.set('baz.hbs', { contents: Buffer.from('before {% body %} after') });
      app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
      const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      await app.render(file);
      assert.equal(file.contents.toString(), 'before This is content after');
    });

    it('should throw an error when a layout cannot be found on app.kinds.layout', async() => {
      app.layouts.set('fsjfsjslkjf.hbs', { contents: Buffer.from('before {% body %} after') });

      const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

      return app.render(file)
        .catch(err => {
          assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
        });
    });
  });
});
