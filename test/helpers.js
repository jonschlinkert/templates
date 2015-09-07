/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var App = require('../');
var app;

describe('helpers', function () {
  describe('constructor', function () {
    it('should create an instance of Helpers:', function () {
      app = new App();
      assert(app instanceof App);
    });
  });

  describe('prototype methods', function () {
    beforeEach(function() {
      app = new App();
    });
    it('should expose `helper`', function () {
      assert(typeof app.helper ==='function');
    });
    it('should expose `asyncHelper`', function () {
      assert(typeof app.asyncHelper ==='function');
    });
  });

  describe('helpers', function() {
    beforeEach(function() {
      app = new App();
    });

    it('should throw an error when value is invalid:', function () {
      (function () {
        app.helper('foo', {});
      }).should.throw('expected helper fn to be a function.');
    });

    it('should add a sync helper to the `sync` object:', function () {
      app.helper('one', function () {});
      assert(typeof app._.helpers.sync.one === 'function');
    });

    it('should get a sync helper:', function () {
      app.helper('one', function () {});
      assert(typeof app.helper('one') === 'function');
    });

    it('should load a glob of sync helper functions:', function () {
      app.helpers('test/fixtures/helpers/[a-c].js');
      assert(typeof app._.helpers.sync.a === 'function');
      assert(typeof app._.helpers.sync.b === 'function');
      assert(typeof app._.helpers.sync.c === 'function');
    });

    it('should fail gracefully on bad globs:', function () {
      app.helpers('test/fixtures/helpers/*.foo');
      app._.helpers.sync.should.eql({});
    });

    it('should throw an error if an invalid arg is passed:', function () {
      (function () {
        app.helpers(function() {})
      }).should.throw('expected helpers to be an object.');
    });

    it('should add a glob of sync helper objects:', function () {
      app.helpers('test/fixtures/helpers/!([a-c]).js');
      assert(typeof app._.helpers.sync.one === 'function');
      assert(typeof app._.helpers.sync.two === 'function');
      assert(typeof app._.helpers.sync.three === 'function');
    });

    it('should add a glob with mixed helper objects and functions:', function () {
      app.helpers('test/fixtures/helpers/*.js');
      assert(typeof app._.helpers.sync.a === 'function');
      assert(typeof app._.helpers.sync.b === 'function');
      assert(typeof app._.helpers.sync.c === 'function');
      assert(typeof app._.helpers.sync.one === 'function');
      assert(typeof app._.helpers.sync.two === 'function');
      assert(typeof app._.helpers.sync.three === 'function');
    });

    it('should add an object of sync helpers to the `sync` object:', function () {
      app.helpers({
        x: function () {},
        y: function () {},
        z: function () {}
      });

      assert(typeof app._.helpers.sync.x === 'function');
      assert(typeof app._.helpers.sync.y === 'function');
      assert(typeof app._.helpers.sync.z === 'function');
    });
  });

  describe('async helpers', function() {
    beforeEach(function() {
      app = new App();
    });

    it('should throw an error when value is invalid:', function () {
      (function () {
        app.asyncHelper('foo', {});
      }).should.throw('expected helper fn to be a function.');
    });

    it('should add an async helper to the `async` object:', function () {
      app.asyncHelper('two', function () {});
      assert(typeof app._.helpers.async.two === 'function');
    });

    it('should get an async helper:', function () {
      app.asyncHelper('one', function () {});
      assert(typeof app.asyncHelper('one') === 'function');
    });

    it('should load a glob of async helper functions:', function () {
      app.asyncHelpers('test/fixtures/helpers/[a-c].js');
      assert(typeof app._.helpers.async.a === 'function');
      assert(typeof app._.helpers.async.b === 'function');
      assert(typeof app._.helpers.async.c === 'function');
    });

    it('should add a glob of async helper objects:', function () {
      app.asyncHelpers('test/fixtures/helpers/!([a-c]).js');
      assert(typeof app._.helpers.async.one === 'function');
      assert(typeof app._.helpers.async.two === 'function');
      assert(typeof app._.helpers.async.three === 'function');
    });

    it('should fail gracefully on bad globs:', function () {
      app.asyncHelpers('test/fixtures/helpers/*.foo');
      app._.helpers.async.should.eql({});
    });

    it('should throw an error if an invalid arg is passed:', function () {
      (function () {
        app.asyncHelpers(function() {})
      }).should.throw('expected helpers to be an object.');
    });

    it('should add a glob with mixed helper objects and functions:', function () {
      app.asyncHelpers('test/fixtures/helpers/*.js');
      assert(typeof app._.helpers.async.a === 'function');
      assert(typeof app._.helpers.async.b === 'function');
      assert(typeof app._.helpers.async.c === 'function');
      assert(typeof app._.helpers.async.one === 'function');
      assert(typeof app._.helpers.async.two === 'function');
      assert(typeof app._.helpers.async.three === 'function');
    });

    it('should add an object of async helpers to the `async` object:', function () {
      app.asyncHelpers({
        x: function () {},
        y: function () {},
        z: function () {}
      });

      assert(typeof app._.helpers.async.x === 'function');
      assert(typeof app._.helpers.async.y === 'function');
      assert(typeof app._.helpers.async.z === 'function');
    });
  });
});

