'use strict';

const assert = require('assert');
const App = require('..');
let app;

describe('app.engine', () => {
  beforeEach(() => {
    app = new App();
  });

  it('should allow the noop engine to be set on options', () => {
    app.option('engine', 'noop');
    assert(app.engine());
    assert.equal(app.engine().name, 'noop');
    assert.equal(typeof app.engine(), 'object');
    assert.equal(typeof app.engine().instance, 'object');
    assert.equal(typeof app.engine().compile, 'function');
    assert.equal(typeof app.engine().render, 'function');
    assert.equal(typeof app.engine().compileSync, 'function');
    assert.equal(typeof app.engine().renderSync, 'function');
  });

  it('should allow a registered engine to be set on options', () => {
    app.engine('foo', {
      instance: {},
      compile() {},
      async render(file) {},
      renderSync(file) {}
    });
    app.option('engine', 'foo');
    assert(app.engine());
    assert.equal(app.engine().name, 'foo');
    assert.equal(typeof app.engine(), 'object');
    assert.equal(typeof app.engine().instance, 'object');
    assert.equal(typeof app.engine().compile, 'function');
    assert.equal(typeof app.engine().render, 'function');
    assert.equal(typeof app.engine().renderSync, 'function');
  });
});
