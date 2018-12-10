'use strict';

const assert = require('assert');
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const App = require('..');
let app;

describe('app.renderLayout', () => {
  beforeEach(function() {
    app = new App();
    app.create('layouts', { type: 'layout' });
    app.create('pages');
    app.engine('hbs', engine(handlebars.create()));
  });

  it('should throw an error when a layout cannot be found', async() => {
    let file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });
    return app.renderLayout(file).catch(err => {
      assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
    });
  });

  it('should throw an error when layout syntax cannot be found', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before NO TAG after') });
    let file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    return app.renderLayout(file, { layouts: app.layouts.files })
      .then(() => {
        return Promise.reject(new Error('expected an error'));
      })
      .catch(err => {
        assert(/cannot find tag/.test(err.message));
      });
  });

  it('should throw an error when layout.contents is not a buffer', async() => {
    let layouts = {
      'default.hbs': { contents: 'before {% body %} after' }
    };

    let file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    return app.renderLayout(file, { layouts })
      .then(() => {
        return Promise.reject(new Error('expected an error'));
      })
      .catch(err => {
        assert.equal(err.message, 'expected layout.contents to be a buffer');
      });
  });

  it('should not try to add layout to null contents', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: null, layout: 'default' });

    await app.renderLayout(file, { layouts: app.layouts.files });
    assert.equal(file.contents, null);
  });

  it('should not apply layout when name is `null`', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: 'Foo', layout: null });

    await app.renderLayout(file, { layouts: app.layouts.files });
    assert.equal(file.contents, 'Foo');
  });

  it('should not apply layout when name is string `null`', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: 'Foo', layout: 'null' });

    await app.renderLayout(file, { layouts: app.layouts.files });
    assert.equal(file.contents, 'Foo');
  });

  it('should not apply layout when name is string `false`', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: 'Foo', layout: 'false' });

    await app.renderLayout(file, { layouts: app.layouts.files });
    assert.equal(file.contents, 'Foo');
  });

  it('should not apply layout when name is string `false`', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: 'Foo', layout: false });

    await app.renderLayout(file, { layouts: app.layouts.files });
    assert.equal(file.contents, 'Foo');
  });

  it('should get layouts from renderLayout options', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    await app.renderLayout(file, { layouts: app.layouts.files });
    assert.equal(file.contents.toString(), 'before This is content after');
  });

  it('should use custom property for layouts', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), block: 'default' });

    await app.renderLayout(file, { layouts: app.layouts.files, layoutKey: 'block' });
    assert.equal(file.contents.toString(), 'before This is content after');
  });

  it('should get layouts from app.types.layouts', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    await app.renderLayout(file);
    assert.equal(file.contents.toString(), 'before This is content after');
  });

  it('should render a layout multiple times when history is reset', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('A{% body %}B') });
    let file = await app.pages.set('a.hbs', { contents: Buffer.from(' This is content '), layout: 'default' });

    await app.renderLayout(file, { history: [] });
    await app.renderLayout(file, { history: [] });
    await app.renderLayout(file, { history: [] });
    assert.equal(file.contents.toString(), 'AAA This is content BBB');
  });

  it('should trim contents', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('A{% body %}B') });
    let file = await app.pages.set('a.hbs', { contents: Buffer.from(' This is content '), layout: 'default' });

    await app.renderLayout(file, { trimContents: true });
    assert.equal(file.contents.toString(), 'AThis is contentB');
  });

  it('should use custom layout regex', async() => {
    app.layouts.set('default.hbs', { contents: Buffer.from('A{{ body }}B') });
    let file = await app.pages.set('a.hbs', { contents: Buffer.from(' This is content '), layout: 'default' });

    await app.renderLayout(file, { layoutRegex: /{{ body }}/g });
    assert.equal(file.contents.toString(), 'A This is content B');
  });

  it('should preserve whitespace when `options.preserveWhitespace` is true', async() => {
    let str = `
    {% body %}
`;
    app.layouts.set('default.hbs', { contents: Buffer.from(str) });
    let file = await app.pages.set('a.hbs', {
      contents: Buffer.from('Foo\nBar\nBaz'),
      layout: 'default'
    });

    await app.renderLayout(file, { preserveWhitespace: true });
    assert.equal(file.contents.toString(), '\n    Foo\n    Bar\n    Baz\n');
  });

  it('should preserve whitespace with custom layoutRegex', async() => {
    let str = `
    {{ body }}
`;
    app.layouts.set('default.hbs', { contents: Buffer.from(str) });
    let file = await app.pages.set('a.hbs', {
      contents: Buffer.from('Foo\nBar\nBaz'),
      layout: 'default'
    });

    await app.renderLayout(file, { preserveWhitespace: true, layoutRegex: /{{ body }}/g });
    assert.equal(file.contents.toString(), '\n    Foo\n    Bar\n    Baz\n');
  });

  it('should throw an error when a layout cannot be found on app.types.layout', async() => {
    app.layouts.set('fsjfsjslkjf.hbs', { contents: Buffer.from('before {% body %} after') });
    let file = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    return app.renderLayout(file)
      .catch(err => {
        assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
      });
  });
});
