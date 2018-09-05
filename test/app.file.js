'use strict';

const path = require('path');
const assert = require('assert');
const App = require('..');
let app;

describe('app.file', () => {
  beforeEach(() => {
    app = new App();
  });

  it('should create a file', () => {
    const file = app.file('foo.hbs');
    assert.equal(file.path, 'foo.hbs');
  });

  it('should set file.contents when second argument is a string', () => {
    const file = app.file('foo.hbs', 'bar');
    assert.equal(file.path, 'foo.hbs');
    assert.equal(file.contents.toString(), 'bar');
  });
});
