'use strict';

const path = require('path');
const assert = require('assert');
const Common = require('../lib/common');
const App = require('..');
let app;

describe('Common', function() {
  beforeEach(function() {
    app = new Common();
  })

  it('should create an instance of the Common class', function() {
    assert(app instanceof Common);
  });

  it('should decorate a .use method', function() {
    assert.equal(typeof app.use, 'function');
  });

  it('should decorate a .run method', function() {
    assert.equal(typeof app.run, 'function');
  });
});
