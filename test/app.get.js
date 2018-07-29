'use strict';

const path = require('path');
const assert = require('assert');
const App = require('..');
let app;

describe('app.get', () => {
  beforeEach(function() {
    app = new App();
    app.create('pages');
  });

  it('should get a view from collection.views', () => {
    app.pages.set('foo.hbs', {});
    const page = app.get('foo.hbs');
    assert.equal(page.path, path.resolve('foo.hbs'));
  });

  it('should get a view from collection.views', () => {
    const filepath = path.resolve(__dirname, 'foo.hbs');
    app.pages.set(filepath, {});
    const page = app.get(filepath);
    assert.equal(page.path, filepath);
  });

  it('should be undefined when view does not exist', () => {
    const page = app.get('test/foo.hbs');
    assert.equal(page, undefined);
  });
});
