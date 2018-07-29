'use strict';

const assert = require('assert');
const handlebars = require('./support/handlebars');
const App = require('..');
let app;

describe('app.renderLayout', () => {
  beforeEach(function() {
    app = new App();
    app.create('layouts', { kind: 'layout' });
    app.create('pages');
    app.engine('hbs', handlebars(require('handlebars')));
  });

  it('should throw an error when a layout cannot be found', () => {
    const view = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });
    assert.throws(() => app.renderLayout(view), /layout "default" is defined on "a\.hbs" but cannot be found/);
  });

  it('should get layouts from render locals', () => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    const view = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    app.renderLayout(view, { layouts: app.layouts.views });
    assert.equal(view.contents.toString(), 'before This is content after');
  });

  it('should get layouts from render options', () => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    const view = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    app.renderLayout(view, { layouts: app.layouts.views });
    assert.equal(view.contents.toString(), 'before This is content after');
  });

  it('should get layouts from app.types.layouts', () => {
    app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
    const view = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    app.renderLayout(view);
    assert.equal(view.contents.toString(), 'before This is content after');
  });

  it('should render a layout multiple times when history is reset', () => {
    app.layouts.set('default.hbs', { contents: Buffer.from('A{% body %}B') });
    const view = app.pages.set('a.hbs', { contents: Buffer.from(' This is content '), layout: 'default' });

    app.renderLayout(view, { history: [] });
    app.renderLayout(view, { history: [] });
    app.renderLayout(view, { history: [] });
    assert.equal(view.contents.toString(), 'AAA This is content BBB');
  });

  it('should throw an error when a layout cannot be found on app.types.layout', () => {
    app.layouts.set('fsjfsjslkjf.hbs', { contents: Buffer.from('before {% body %} after') });
    const view = app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

    assert.throws(() => app.renderLayout(view), /layout "default" is defined on "a.hbs" but cannot be found/);
  });
});
