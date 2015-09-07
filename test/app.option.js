/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var App = require('../');
var app;

describe('app.option', function () {
  beforeEach(function () {
    app = new App();
  });

  it('should set a key-value pair on options:', function () {
    app.option('a', 'b');
    assert(app.options.a === 'b');
  });

  it('should set an object on options:', function () {
    app.option({c: 'd'});
    assert(app.options.c === 'd');
  });
});
