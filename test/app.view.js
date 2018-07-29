'use strict';

const path = require('path');
const assert = require('assert');
const App = require('..');
let app;

describe('app.view', () => {
  beforeEach(function() {
    app = new App();
  });

  it('should create a view', () => {
    const view = app.view('foo.hbs');
    assert.equal(view.path, path.resolve('foo.hbs'));
  });

  it('should set view.contents when second argument is a string', () => {
    const view = app.view('foo.hbs', 'bar');
    assert.equal(view.path, path.resolve('foo.hbs'));
    assert.equal(view.contents.toString(), 'bar');
  });
});
