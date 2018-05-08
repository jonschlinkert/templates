'use strict';

const assert = require('assert');
const handlebars = require('./support/handlebars');
const engines = require('./support/engines');
const App = require('..');
let app;

describe('app.render', function() {
  beforeEach(function() {
    app = new App({ asyncHelpers: true });
    app.create('layouts', { kind: 'layout' });
    app.create('pages');
    app.engine('hbs', handlebars(require('handlebars')));
  });

  describe('rendering', function() {
    it('should throw an error when view is not an object', function() {
      return app.render()
        .then(() => {
          throw new Error('expected an error');
        })
        .catch(err => {
          assert(err);
          assert(/view/.test(err.message));
        });
    });

    it('should throw an error when an engine is not defined:', async() => {
      const page = await app.pages.set('foo.bar', { contents: Buffer.from('<%= name %>') });
      app.engines = new Map();

      return app.render(page)
        .then(() => {
          throw new Error('expected an error');
        })
        .catch(err => {
          assert(err);
          assert(/engine "bar" is not registered/.test(err.message));
        });
    });

    it('should support using helpers to render a view:', async () => {
      app.helper('upper', str => str.toUpperCase(str));

      const page = await app.pages.set('a.hbs', {
        contents: Buffer.from('a {{upper name}} b'),
        data: { name: 'Brian' }
      });

      await app.render(page);
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });

    it('should support using async helpers to render a view:', async () => {
      app.helper('upper', function(str) {
        return new Promise(resolve => {
          setTimeout(() => resolve(str.toUpperCase(str)), 10);
        });
      });

      const page = await app.pages.set('a.hbs', {
        contents: Buffer.from('a {{upper name}} b'),
        data: { name: 'Brian' }
      });

      await app.render(page);
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });

    it('should use globally defined data to render a view', async() => {
      app.cache.data.name = 'Brian';
      app.helper('upper', str => str.toUpperCase(str));

      const page = await app.pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b') });
      await app.render(page);
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });

    it('should render a view from its path:', async() => {
      app.helper('upper', str => str.toUpperCase(str));
      const page = await app.pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });

      await app.render('a.hbs');
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });
  });
});
