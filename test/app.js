/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var Templates = require('../');
var templates;

describe('templates', function () {
  describe('constructor', function () {
    it('should create an instance of Templates:', function () {
      var templates = new Templates();
      assert(templates instanceof Templates);
    });

    it('should new up without new:', function () {
      var templates = Templates();
      assert(templates instanceof Templates);
    });
  });

  describe('static methods', function () {
    it('should expose `extend`:', function () {
      assert(typeof Templates.extend ==='function');
    });
  });

  describe('prototype methods', function () {
    beforeEach(function() {
      templates = new Templates();
    });

    it('should expose `set`', function () {
      assert(typeof templates.set ==='function');
    });
    it('should expose `get`', function () {
      assert(typeof templates.get ==='function');
    });
    it('should expose `visit`', function () {
      assert(typeof templates.visit ==='function');
    });
    it('should expose `define`', function () {
      assert(typeof templates.define ==='function');
    });
    it('should expose `views`', function () {
      assert(typeof templates.views === 'object');
    });
  });

  describe('instance', function () {
    beforeEach(function() {
      templates = new Templates();
    });

    it('should set a value on the instance:', function () {
      templates.set('a', 'b');
      assert(templates.a ==='b');
    });

    it('should get a value from the instance:', function () {
      templates.set('a', 'b');
      assert(templates.get('a') ==='b');
    });
  });
});
