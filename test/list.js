/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
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
    it('should expose `addItem`', function () {
      assert(typeof list.addItem ==='function');
    });

    it('should expose `items`', function () {
      assert(Array.isArray(list.items));
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

  describe('addItem', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should throw an error when value is invalid:', function () {
      (function () {
        list.addItem('foo');
      }).should.throw('expected value to be an object.');
    });

    it('should add an item to `items`:', function () {
      list.addItem('one', {contents: new Buffer('...')});
      assert(list.items.length === 1);
      assert(Buffer.isBuffer(list.items[0].contents));
    });

    it('should create an instance of `Item`:', function () {
      list.addItem('one', {contents: new Buffer('...')});
      assert(list.items[0] instanceof list.Item);
    });

    it('should allow an `Item` constructor to be passed:', function () {
      var Vinyl = require('vinyl');
      Vinyl.prototype.foo = function(key, value) {
        this[key] = value;
      };
      list = new List({Item: Vinyl});
      list.addItem('one', {contents: new Buffer('...')});
      list.items[0].foo('bar', 'baz');
      assert(list.items[0].bar === 'baz');
    });

    it('should allow an instance of `Item` to be passed:', function () {
      var View = require('../lib/view');
      var list = new List({Item: View});
      var item = new View({contents: new Buffer('...')});
      list.addItem('one', item);
      item.set('abc', 'xyz');
      assert(list.items[0] instanceof list.Item);
      assert(Buffer.isBuffer(list.items[0].contents));
      assert(list.items[0].abc === 'xyz');
    });
  });

  describe('addItems', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should add multiple items:', function () {
      list.addItems({
        one: {contents: new Buffer('foo')},
        two: {contents: new Buffer('bar')}
      });
      assert(Buffer.isBuffer(list.items[0].contents));
      assert(Buffer.isBuffer(list.items[1].contents));
    });
  });

  describe('getIndex', function() {
    beforeEach(function() {
      list = new List();
    });
    it('should get the index of a key when key is not renamed:', function () {
      list.addItem('a/b/c/ddd.hbs', {contents: new Buffer('ddd')});
      list.addItem('a/b/c/eee.hbs', {contents: new Buffer('eee')});
      assert(list.getIndex('a/b/c/ddd.hbs') === 0);
      assert(list.getIndex('a/b/c/eee.hbs') === 1);
    });

    it('should get the index of a key when key is renamed:', function () {
      list = new List({
        renameKey: function (key) {
          return path.basename(key);
        }
      });
      list.addItem('a/b/c/ddd.hbs', {contents: new Buffer('ddd')});
      list.addItem('a/b/c/eee.hbs', {contents: new Buffer('eee')});
      assert(list.getIndex('a/b/c/ddd.hbs') === 0);
      assert(list.getIndex('ddd.hbs') === 0);
      assert(list.getIndex('a/b/c/eee.hbs') === 1);
      assert(list.getIndex('eee.hbs') === 1);
    });
  });

  describe('getItem', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should get an item from `items`:', function () {
      list.addItem('one', {contents: new Buffer('aaa')});
      list.addItem('two', {contents: new Buffer('zzz')});
      assert(list.items.length === 2);
      assert(Buffer.isBuffer(list.items[0].contents));
      assert(Buffer.isBuffer(list.getItem('one').contents));
      assert(list.getItem('one').contents.toString() === 'aaa');
      assert(list.getItem('two').contents.toString() === 'zzz');
    });
  });

  describe('count', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should get the number of items:', function () {
      list.addItem('one', {contents: new Buffer('aaa')});
      list.addItem('two', {contents: new Buffer('zzz')});
      assert(list.count === 2);
    });

    it('should throw an error if attemptin to set count:', function () {
      (function () {
        list.count = 5;
      }).should.throw('count is a read-only getter and cannot be defined.');
    });
  });
});

