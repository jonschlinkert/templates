'use strict';

const path = require('path');
const assert = require('assert');
const App = require('..');
let app;

describe('app.view', function() {
  beforeEach(function() {
    app = new App();
  })

  it('should create a view', async function() {
    const view = app.view('foo.hbs');
    assert.equal(view.path, 'foo.hbs');
  });

  it('should set view.contents when second argument is a string', async function() {
    const view = app.view('foo.hbs', 'bar');
    assert.equal(view.path, 'foo.hbs');
    assert.equal(view.contents.toString(), 'bar');
  });
});
