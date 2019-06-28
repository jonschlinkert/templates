'use strict';

const assert = require('assert').strict;
const Base = require('../lib/base');
let app;

describe('Base class', () => {
  beforeEach(function() {
    app = new Base();
  });

  it('should create an instance of the Base class', () => {
    assert(app instanceof Base);
  });

  it('should decorate a .use method', () => {
    assert.equal(typeof app.use, 'function');
  });

  it('should decorate a .run method', () => {
    assert.equal(typeof app.run, 'function');
  });
});
