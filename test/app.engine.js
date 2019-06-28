'use strict';

const assert = require('assert').strict;
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

  it('should allow noop engine to be defined on options', async () => {
    app.option('engine', 'noop');
    let file = app.file('foo', { contents: 'This is contents' });
    return app.render(file)
      .then(file => {
        assert.equal(file.contents.toString(), 'This is contents');
      });
  });

  it('should allow noop engine to be defined on options when sync is true', () => {
    app = new App({ sync: true });
    app.option('engine', 'noop');
    let file = app.file('foo', { contents: 'This is contents' });
    app.render(file);
    assert.equal(file.contents.toString(), 'This is contents');
  });

  it('should support compileSync on noop engine', () => {
    app = new App({ sync: true });
    app.option('engine', 'noop');
    let file = app.file('foo', { contents: 'This is contents' });
    app.compile(file);
    assert.equal(file.fn(), 'This is contents');
  });
});
