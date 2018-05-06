'use strict';

const assert = require('assert');
const engine = require('../lib/engine');
const App = require('..');
let app;

describe('app.renderSync', function() {
  beforeEach(function() {
    app = new App({ sync: true });
    app.engine('hbs', engine(require('handlebars')));
    app.create('layouts', { kind: 'layout' });
    app.create('pages');
  });

  // describe('rendering', function() {
  //   it('should throw an error when view is not an object', function() {
  //     return app.render()
  //       .then(() => {
  //         throw new Error('expected an error');
  //       })
  //       .catch(err => {
  //         assert(err);
  //         assert(/view/.test(err.message));
  //       });
  //   });

  //   it('should throw an error when an engine is not defined:', async() => {
  //     const page = await app.pages.set('foo.bar', { contents: Buffer.from('<%= name %>') });
  //     app.engines.delete('.hbs');

  //     return app.render(page)
  //       .then(() => {
  //         throw new Error('expected an error');
  //       })
  //       .catch(err => {
  //         assert(err);
  //         assert(/engine "\.bar" is not registered/.test(err.message));
  //       });
  //   });

  //   it('should support using helpers to render a view:', async () => {
  //     app.helper('upper', str => str.toUpperCase(str));

  //     const page = await app.pages.set('a.hbs', {
  //       contents: Buffer.from('a {{upper name}} b'),
  //       data: { name: 'Brian' }
  //     });

  //     await app.render(page);
  //     assert.equal(page.contents.toString(), 'a BRIAN b');
  //   });

  //   it('should support using async helpers to render a view:', async () => {
  //     app.helper('upper', function(str) {
  //       return new Promise(resolve => {
  //         setTimeout(() => resolve(str.toUpperCase(str)), 10);
  //       });
  //     });

  //     const page = await app.pages.set('a.hbs', {
  //       contents: Buffer.from('a {{upper name}} b'),
  //       data: { name: 'Brian' }
  //     });

  //     await app.render(page);
  //     assert.equal(page.contents.toString(), 'a BRIAN b');
  //   });

  //   it('should use globally defined data to render a view', async() => {
  //     app.cache.data.name = 'Brian';
  //     app.helper('upper', str => str.toUpperCase(str));

  //     const page = await app.pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b') });
  //     await app.render(page);
  //     assert.equal(page.contents.toString(), 'a BRIAN b');
  //   });

  //   it('should render a view from its path:', async() => {
  //     app.helper('upper', str => str.toUpperCase(str));
  //     const page = await app.pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });

  //     await app.render('a.hbs');
  //     assert.equal(page.contents.toString(), 'a BRIAN b');
  //   });
  // });

  // describe('layouts', function() {
  //   it('should throw an error when a layout cannot be found', async() => {
  //     const view = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

  //     return app.render(view)
  //       .catch(err => {
  //         assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
  //       });
  //   });

  //   it('should render get layouts from render locals', async() => {
  //     app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
  //     const view = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

  //     await app.render(view, { layouts: app.layouts.views });
  //     assert.equal(view.contents.toString(), 'before This is content after');
  //   });

  //   it('should render get layouts from render options', async() => {
  //     app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
  //     const view = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

  //     await app.render(view, null, { layouts: app.layouts.views });
  //     assert.equal(view.contents.toString(), 'before This is content after');
  //   });

  //   it('should get layouts from app.kinds.layouts', async() => {
  //     app.layouts.set('default.hbs', { contents: Buffer.from('before {% body %} after') });
  //     const view = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

  //     await app.render(view);
  //     assert.equal(view.contents.toString(), 'before This is content after');
  //   });

  //   it('should throw an error when a layout cannot be found on app.kinds.layout', async() => {
  //     app.layouts.set('fsjfsjslkjf.hbs', { contents: Buffer.from('before {% body %} after') });

  //     const view = await app.pages.set('a.hbs', { contents: Buffer.from('This is content'), layout: 'default' });

  //     return app.render(view)
  //       .catch(err => {
  //         assert.equal(err.message, 'layout "default" is defined on "a.hbs" but cannot be found');
  //       });
  //   });
  // });
});
