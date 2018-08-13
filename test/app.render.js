'use strict';

const assert = require('assert');
const handlebars = require('./support/handlebars');
const App = require('..');
let app;

describe('app.render', () => {
  beforeEach(() => {
    app = new App();
    app.create('layouts', { kind: 'layout' });
    app.create('pages');
    app.engine('hbs', handlebars(require('handlebars')));
  });

  describe('rendering', () => {
    it('should throw an error when view is not an object', () => {
      assert.throws(() => app.render());
    });

    it('should throw an error when an engine is not registered', () => {
      const page = app.pages.set('foo.bar', { contents: Buffer.from('<%= name %>') });
      app.engines = new Map();
      assert.throws(() => app.render(page), /engine "bar"/);
    });

    it('should support using helpers to render a view:', () => {
      app.helper('upper', str => str.toUpperCase(str));

      const page = app.pages.set('a.hbs', {
        contents: Buffer.from('a {{upper name}} b'),
        data: { name: 'Brian' }
      });

      app.render(page);
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });

    it('should use globally defined data to render a view', () => {
      app.cache.data.name = 'Brian';
      app.helper('upper', str => str.toUpperCase(str));

      const page = app.pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b') });
      app.render(page);
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });

    it('should render a view from its path:', () => {
      app.helper('upper', str => str.toUpperCase(str));
      const page = app.pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });

      app.render('a.hbs');
      assert.equal(page.contents.toString(), 'a BRIAN b');
    });
  });
});
