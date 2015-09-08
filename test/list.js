var path = require('path');
var assert = require('assert');
require('should');
require('mocha');
var List = require('../lib/list');
var list;

describe('list', function () {
  describe('constructor', function () {
    it('should create an instance of List:', function () {
      var list = new List();
      assert(list instanceof List);
    });
  });

  describe('static methods', function () {
    it('should expose `extend`:', function () {
      assert(typeof List.extend ==='function');
    });
  });

  describe('prototype methods', function () {
    beforeEach(function() {
      list = new List();
    });

    it('should expose `set`', function () {
      assert(typeof list.set ==='function');
    });
    it('should expose `get`', function () {
      assert(typeof list.get ==='function');
    });
    it('should expose `visit`', function () {
      assert(typeof list.visit ==='function');
    });
    it('should expose `define`', function () {
      assert(typeof list.define ==='function');
    });
    it('should expose `addView`', function () {
      assert(typeof list.addView ==='function');
    });

    it('should expose `views`', function () {
      assert(Array.isArray(list.views));
    });
    it('should expose `keys`', function () {
      assert(Array.isArray(list.keys));
    });
  });

  describe('instance', function () {
    beforeEach(function() {
      list = new List();
    });

    it('should set a value on the instance:', function () {
      list.set('a', 'b');
      assert(list.a ==='b');
    });

    it('should get a value from the instance:', function () {
      list.set('a', 'b');
      assert(list.get('a') ==='b');
    });
  });

  describe('addView', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should throw an error when value is invalid:', function () {
      (function () {
        list.addView('foo');
      }).should.throw('expected value to be an object.');
    });

    it('should add an view to `views`:', function () {
      list.addView('one', {contents: new Buffer('...')});
      assert(list.views.length === 1);
      assert(Buffer.isBuffer(list.views[0].contents));
    });

    it('should create an instance of `View`:', function () {
      list.addView('one', {contents: new Buffer('...')});
      assert(list.views[0] instanceof list.View);
    });

    it('should allow an `View` constructor to be passed:', function () {
      var Vinyl = require('vinyl');
      Vinyl.prototype.foo = function(key, value) {
        this[key] = value;
      };
      list = new List({View: Vinyl});
      list.addView('one', {contents: new Buffer('...')});
      list.views[0].foo('bar', 'baz');
      assert(list.views[0].bar === 'baz');
    });

    it('should allow an instance of `View` to be passed:', function () {
      var View = require('../lib/view');
      var list = new List({View: View});
      var view = new View({contents: new Buffer('...')});
      list.addView('one', view);
      view.set('abc', 'xyz');
      assert(list.views[0] instanceof list.View);
      assert(Buffer.isBuffer(list.views[0].contents));
      assert(list.views[0].abc === 'xyz');
    });
  });

  describe('addViews', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should add multiple views:', function () {
      list.addViews({
        one: {contents: new Buffer('foo')},
        two: {contents: new Buffer('bar')}
      });
      assert(Buffer.isBuffer(list.views[0].contents));
      assert(Buffer.isBuffer(list.views[1].contents));
    });
  });

  describe('getIndex', function() {
    beforeEach(function() {
      list = new List();
    });
    it('should get the index of a key when key is not renamed:', function () {
      list.addView('a/b/c/ddd.hbs', {contents: new Buffer('ddd')});
      list.addView('a/b/c/eee.hbs', {contents: new Buffer('eee')});
      assert(list.getIndex('a/b/c/ddd.hbs') === 0);
      assert(list.getIndex('a/b/c/eee.hbs') === 1);
    });

    it('should get the index of a key when key is renamed:', function () {
      list = new List({
        renameKey: function (key) {
          return path.basename(key);
        }
      });
      list.addView('a/b/c/ddd.hbs', {contents: new Buffer('ddd')});
      list.addView('a/b/c/eee.hbs', {contents: new Buffer('eee')});
      assert(list.getIndex('a/b/c/ddd.hbs') === 0);
      assert(list.getIndex('ddd.hbs') === 0);
      assert(list.getIndex('a/b/c/eee.hbs') === 1);
      assert(list.getIndex('eee.hbs') === 1);
    });
  });

  describe('getView', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should get an view from `views`:', function () {
      list.addView('one', {contents: new Buffer('aaa')});
      list.addView('two', {contents: new Buffer('zzz')});
      assert(list.views.length === 2);
      assert(Buffer.isBuffer(list.views[0].contents));
      assert(Buffer.isBuffer(list.getView('one').contents));
      assert(list.getView('one').contents.toString() === 'aaa');
      assert(list.getView('two').contents.toString() === 'zzz');
    });
  });

  describe('count', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should get the number of views:', function () {
      list.addView('one', {contents: new Buffer('aaa')});
      list.addView('two', {contents: new Buffer('zzz')});
      assert(list.count === 2);
    });

    it('should throw an error if attemptin to set count:', function () {
      (function () {
        list.count = 5;
      }).should.throw('count is a read-only getter and cannot be defined.');
    });
  });
});

