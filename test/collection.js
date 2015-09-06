/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var Collection = require('../lib/collection');
var collection;

describe('collection', function () {
  describe('constructor', function () {
    it('should create an instance of Collection:', function () {
      var collection = new Collection();
      assert(collection instanceof Collection);
    });
  });

  describe('static methods', function () {
    it('should expose `extend`:', function () {
      assert(typeof Collection.extend ==='function');
    });
  });

  describe('prototype methods', function () {
    beforeEach(function() {
      collection = new Collection();
    });

    it('should expose `set`', function () {
      assert(typeof collection.set ==='function');
    });
    it('should expose `get`', function () {
      assert(typeof collection.get ==='function');
    });
    it('should expose `visit`', function () {
      assert(typeof collection.visit ==='function');
    });
    it('should expose `define`', function () {
      assert(typeof collection.define ==='function');
    });
    it('should expose `addItem`', function () {
      assert(typeof collection.addItem ==='function');
    });
  });

  describe('instance', function () {
    beforeEach(function() {
      collection = new Collection();
    });

    it('should throw an error if attempting to set count:', function () {
      (function () {
        collection.count = 5;
      }).should.throw('count is a read-only getter and cannot be defined.');
    });

    it('should set a value on the instance:', function () {
      collection.set('a', 'b');
      assert(collection.a ==='b');
    });

    it('should get a value from the instance:', function () {
      collection.set('a', 'b');
      assert(collection.get('a') ==='b');
    });
  });

  describe('addItem', function() {
    beforeEach(function() {
      collection = new Collection();
    });

    it('should throw an error when value is invalid:', function () {
      (function () {
        collection.addItem('foo');
      }).should.throw('expected value to be an object.');
    });

    it('should add an item to `items`:', function () {
      collection.addItem('one', {contents: new Buffer('...')});
      assert(typeof collection.items.one === 'object');
      assert(Buffer.isBuffer(collection.items.one.contents));
    });

    it('should create an instance of `Item`:', function () {
      collection.addItem('one', {contents: new Buffer('...')});
      assert(collection.items.one instanceof collection.Item);
    });

    it('should allow an `Item` constructor to be passed:', function () {
      var View = require('../lib/view');
      View.prototype.foo = function(key, value) {
        this[key] = value;
      };
      collection = new Collection({Item: View});
      collection.addItem('one', {contents: new Buffer('...')});
      collection.items.one.foo('bar', 'baz');
      assert(collection.items.one.bar === 'baz');
    });

    it('should allow an instance of `Item` to be passed:', function () {
      var View = require('../lib/view');
      var collection = new Collection({Item: View});
      var view = new View({contents: new Buffer('...')});
      collection.addItem('one', view);
      view.set('abc', 'xyz');
      assert(collection.items.one instanceof collection.Item);
      assert(Buffer.isBuffer(collection.items.one.contents));
      assert(collection.items.one.abc === 'xyz');
    });
  });

  describe('addItems', function() {
    beforeEach(function() {
      collection = new Collection();
    });

    it('should add multiple items:', function () {
      collection.addItems({
        one: {contents: new Buffer('foo')},
        two: {contents: new Buffer('bar')}
      });
      assert(Buffer.isBuffer(collection.items.one.contents));
      assert(Buffer.isBuffer(collection.items.two.contents));
    });
  });

  describe('getItem', function() {
    beforeEach(function() {
      collection = new Collection();
    });
    it('should get an item from `items`:', function () {
      collection.addItem('one', {contents: new Buffer('aaa')});
      collection.addItem('two', {contents: new Buffer('zzz')});
      assert(Buffer.isBuffer(collection.items.one.contents));
      assert(Buffer.isBuffer(collection.getItem('one').contents));
      assert(collection.getItem('one').contents.toString() === 'aaa');
      assert(collection.getItem('two').contents.toString() === 'zzz');
    });
  });

  describe('count', function() {
    beforeEach(function() {
      collection = new Collection();
    });

    it('should get the number of items:', function () {
      collection.addItem('one', {contents: new Buffer('aaa')});
      collection.addItem('two', {contents: new Buffer('zzz')});
      assert(collection.count === 2);
    });
  });
});

describe('options', function() {
  describe('options.renameKey', function() {
    beforeEach(function() {
      collection = new Collection({
        renameKey: function (key) {
          return path.basename(key);
        }
      });
    });

    it('should use a custom rename key function on item keys', function() {
      collection.addItem('a/b/c/d.hbs', {contents: new Buffer('foo bar baz')});
      assert(collection.items['d.hbs'].contents.toString() === 'foo bar baz');
    });

    it('should get an item with the renamed key:', function () {
      collection.addItem('a/b/c/d.hbs', {contents: new Buffer('foo bar baz')});
      assert(collection.getItem('d.hbs').contents.toString() === 'foo bar baz');
    });

    it('should get an item with the original key:', function () {
      collection.addItem('a/b/c/d.hbs', {contents: new Buffer('foo bar baz')});
      assert(collection.getItem('a/b/c/d.hbs').contents.toString() === 'foo bar baz');
    });
  });
});

