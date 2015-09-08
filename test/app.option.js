require('should');
require('mocha');
var path = require('path');
var assert = require('assert');
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

  it('should throw on invalid args:', function () {
    (function () {
      app.option(function () {})
    }).should.throw('expected a string or object.');
  });
});
