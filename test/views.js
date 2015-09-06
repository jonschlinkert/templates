/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var Views = require('../lib/views');
var views;

describe('views', function () {
  describe('constructor', function () {
    it('should create an instance of Views:', function () {
      var views = new Views();
      assert(views instanceof Views);
    });
  });

  describe('static methods', function () {
    it('should expose `extend`:', function () {
      assert(typeof Views.extend ==='function');
    });
  });

  describe('prototype methods', function () {
    beforeEach(function() {
      views = new Views();
    });

    it('should expose `set`', function () {
      assert(typeof views.set ==='function');
    });
    it('should expose `get`', function () {
      assert(typeof views.get ==='function');
    });
    it('should expose `visit`', function () {
      assert(typeof views.visit ==='function');
    });
    it('should expose `define`', function () {
      assert(typeof views.define ==='function');
    });
    it('should expose `addView`', function () {
      assert(typeof views.addView ==='function');
    });
  });

  describe('instance', function () {
    beforeEach(function() {
      views = new Views();
    });

    it('should throw an error if attempting to set count:', function () {
      (function () {
        views.count = 5;
      }).should.throw('count is a read-only getter and cannot be defined.');
    });

    it('should set a value on the instance:', function () {
      views.set('a', 'b');
      assert(views.a ==='b');
    });

    it('should get a value from the instance:', function () {
      views.set('a', 'b');
      assert(views.get('a') ==='b');
    });
  });

  describe('addView', function() {
    beforeEach(function() {
      views = new Views();
    });

    it('should throw an error when value is invalid:', function () {
      (function () {
        views.addView('foo');
      }).should.throw('expected value to be an object.');
    });

    it('should add an view to `views`:', function () {
      views.addView('one', {contents: new Buffer('...')});
      assert(typeof views.views.one === 'object');
      assert(Buffer.isBuffer(views.views.one.contents));
    });

    it('should create an instance of `View`:', function () {
      views.addView('one', {contents: new Buffer('...')});
      assert(views.views.one instanceof views.View);
    });

    it('should allow an `View` constructor to be passed:', function () {
      var View = require('../lib/view');
      View.prototype.foo = function(key, value) {
        this[key] = value;
      };
      views = new Views({View: View});
      views.addView('one', {contents: new Buffer('...')});
      views.views.one.foo('bar', 'baz');
      assert(views.views.one.bar === 'baz');
    });

    it('should allow an instance of `View` to be passed:', function () {
      var View = require('../lib/view');
      var views = new Views({View: View});
      var view = new View({contents: new Buffer('...')});
      views.addView('one', view);
      view.set('abc', 'xyz');
      assert(views.views.one instanceof views.View);
      assert(Buffer.isBuffer(views.views.one.contents));
      assert(views.views.one.abc === 'xyz');
    });
  });

  describe('addViews', function() {
    beforeEach(function() {
      views = new Views();
    });

    it('should add multiple views:', function () {
      views.addViews({
        one: {contents: new Buffer('foo')},
        two: {contents: new Buffer('bar')}
      });
      assert(Buffer.isBuffer(views.views.one.contents));
      assert(Buffer.isBuffer(views.views.two.contents));
    });
  });

  describe('getView', function() {
    beforeEach(function() {
      views = new Views();
    });
    it('should get an view from `views`:', function () {
      views.addView('one', {contents: new Buffer('aaa')});
      views.addView('two', {contents: new Buffer('zzz')});
      assert(Buffer.isBuffer(views.views.one.contents));
      assert(Buffer.isBuffer(views.getView('one').contents));
      assert(views.getView('one').contents.toString() === 'aaa');
      assert(views.getView('two').contents.toString() === 'zzz');
    });
  });

  describe('count', function() {
    beforeEach(function() {
      views = new Views();
    });

    it('should get the number of views:', function () {
      views.addView('one', {contents: new Buffer('aaa')});
      views.addView('two', {contents: new Buffer('zzz')});
      assert(views.count === 2);
    });
  });
});

describe('options', function() {
  describe('options.renameKey', function() {
    beforeEach(function() {
      views = new Views({
        renameKey: function (key) {
          return path.basename(key);
        }
      });
    });

    it('should use a custom rename key function on view keys', function() {
      views.addView('a/b/c/d.hbs', {contents: new Buffer('foo bar baz')});
      assert(views.views['d.hbs'].contents.toString() === 'foo bar baz');
    });

    it('should get an view with the renamed key:', function () {
      views.addView('a/b/c/d.hbs', {contents: new Buffer('foo bar baz')});
      assert(views.getView('d.hbs').contents.toString() === 'foo bar baz');
    });

    it('should get an view with the original key:', function () {
      views.addView('a/b/c/d.hbs', {contents: new Buffer('foo bar baz')});
      assert(views.getView('a/b/c/d.hbs').contents.toString() === 'foo bar baz');
    });
  });
});

