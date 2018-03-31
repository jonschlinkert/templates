'use strict';

const path = require('path');
const assert = require('assert');
const App = require('..');
let app;

describe('app.get', function() {
  beforeEach(function() {
    app = new App();
    app.create('pages');
  })

  it('should get a view from collection.views', async function() {
    await app.pages.set('foo.hbs', {});
    const page = app.get('foo.hbs');
    assert.equal(page.path, 'foo.hbs');
  });

  it('should get a view from collection.views', async function() {
    const fp = path.resolve(__dirname, 'foo.hbs');
    await app.pages.set(fp, {});
    const page = app.get('test/foo.hbs');
    assert.equal(page.path, fp);
  });

  it('should be undefined when view does not exist', async function() {
    const page = app.get('test/foo.hbs');
    assert.equal(page, undefined);
  });
});
