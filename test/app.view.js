'use strict';

const assert = require('assert');
const App = require('..');
let app;

describe('app.view', () => {
  beforeEach(() => {
    app = new App();
  });

  it('should create a view', async () => {
    const view = app.view('foo.hbs');
    assert.equal(view.path, 'foo.hbs');
  });

  it('should set view.contents when second argument is a string', async () => {
    const view = app.view('foo.hbs', 'bar');
    assert.equal(view.path, 'foo.hbs');
    assert.equal(view.contents.toString(), 'bar');
  });
});
