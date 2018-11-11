'use strict';

const assert = require('assert');
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const App = require('..');
let app;

describe('app.renderLayout', () => {
  beforeEach(function() {
    app = new App();
    app.create('layouts', { kind: 'layout' });
    app.create('pages');
    app.engine('hbs', engine(handlebars.create()));
  });

  it('should throw an error when a layout cannot be found', async() => {
    const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });
    return app.renderLayout(file).catch(err => {
      assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
    });
  });

  it('should get layouts from render locals', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    await app.renderLayout(file, { layouts: app.layouts.files });
    assert.equal(file.contents.toString(), 'before This is content after');
  });

  it('should get layouts from render options', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    await app.renderLayout(file, { layouts: app.layouts.files });
    assert.equal(file.contents.toString(), 'before This is content after');
  });

  it('should get layouts from app.types.layouts', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    await app.renderLayout(file);
    assert.equal(file.contents.toString(), 'before This is content after');
  });

  it('should render a layout multiple times when history is reset', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('A{% body %}B') });
    const file = await app.pages.set('a.hbs', { contents: Buffer.from(' This is content '), layout: 'default' });

    await app.renderLayout(file, { history: [] });
    await app.renderLayout(file, { history: [] });
    await app.renderLayout(file, { history: [] });
    assert.equal(file.contents.toString(), 'AAA This is content BBB');
  });

  it('should throw an error when a layout cannot be found on app.types.layout', async() => {
    app.layouts.set('fsjfsjslkjf.hbs', { contents: Buffer.from('before {% body %} after') });
    const file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    return app.renderLayout(file)
      .catch(err => {
        assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
      });
  });
});
