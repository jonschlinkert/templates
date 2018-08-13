'use strict';

const assert = require('assert');
const Common = require('../lib/common');
let app;

describe('Common', () => {
  beforeEach(() => {
    app = new Common();
  });

  it('should create an instance of the Common class', () => {
    assert(app instanceof Common);
  });

  it('should decorate a .use method', () => {
    assert.equal(typeof app.use, 'function');
  });

  it('should decorate a .run method', () => {
    assert.equal(typeof app.run, 'function');
  });
});
