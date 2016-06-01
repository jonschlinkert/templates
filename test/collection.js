'use strict';

var path = require('path');
var assert = require('assert');
var support = require('./support');
var hasProperties = support.hasProperties;

module.exports = function(App, options, runner) {
  var app;

  var typeOf = require('kind-of');
  var isBuffer = require('is-buffer');
  var List = App.List;
  var Item = App.Item;
  var Collection = App.Collection;
  var collection;

  describe('collection', function() {
    describe('constructor', function() {
      it('should create an instance of Collection', function() {
        var collection = new Collection();
        assert(collection instanceof Collection);
        assert.equal(typeof collection, 'object');
      });

      it('should instantiate without new', function() {
        var collection = Collection();
        assert(collection instanceof Collection);
        assert.equal(typeof collection, 'object');
      });
    });

    describe('static methods', function() {
      it('should expose `extend`', function() {
        assert.equal(typeof Collection.extend, 'function');
      });
    });

    describe('prototype methods', function() {
      beforeEach(function() {
        collection = new Collection();
      });

      var methods = [
        'use',
        'addItem',
        'addItems',
        'addList',
        'getItem',
        'constructor',
        'set',
        'get',
        'del',
        'define',
        'visit',
        'on',
        'once',
        'off',
        'emit',
        'listeners',
        'hasListeners'
      ];

      methods.forEach(function(method) {
        it('should expose ' + method + ' method', function() {
          assert.equal(typeof collection[method], 'function');
        });
      });

      it('should expose isCollection property', function() {
        assert.equal(typeof collection.isCollection, 'boolean');
      });

      it('should expose items property', function() {
        assert.equal(typeOf(collection.items), 'object');
      });

      it('should expose options property', function() {
        assert.equal(typeOf(collection.options), 'object');
      });
    });
  });

  describe('methods', function() {
    beforeEach(function() {
      collection = new Collection();
    });

    describe('chaining', function() {
      it('should allow collection methods to be chained', function() {
        collection
          .addItems({'a.hbs': {path: 'a.hbs'}})
          .addItems({'b.hbs': {path: 'b.hbs'}})
          .addItems({'c.hbs': {path: 'c.hbs'}});

        hasProperties(collection.items, [
          'a.hbs',
          'b.hbs',
          'c.hbs'
        ]);
      });
    });

    describe('use', function() {
      it('should expose the instance to plugins', function() {
        collection
          .use(function(inst) {
            inst.foo = 'bar';
          });

        assert.equal(collection.foo, 'bar');
      });

      it('should expose `item` when the plugin returns a function', function() {
        collection
          .use(function() {
            return function(item) {
              item.foo = 'bar';
            };
          });

        collection.addItem('aaa');
        collection.addItem('bbb');
        collection.addItem('ccc');

        assert.equal(collection.items.aaa.foo, 'bar');
        assert.equal(collection.items.bbb.foo, 'bar');
        assert.equal(collection.items.ccc.foo, 'bar');
      });
    });

    describe('get / set', function() {
      it('should set a value on the instance', function() {
        collection.set('a', 'b');
        assert.equal(collection.a, 'b');
      });

      it('should get a value from the instance', function() {
        collection.set('a', 'b');
        assert.equal(collection.get('a'), 'b');
      });
    });

    describe('adding items', function() {
      beforeEach(function() {
        collection = new Collection();
      });

      it('should load a item onto the respective collection', function() {
        collection.addItem('a.hbs');
        assert(collection.items.hasOwnProperty('a.hbs'));
      });
    });

    describe('item', function() {
      beforeEach(function() {
        collection = new Collection();
      });

      it('should return a single collection item from a key-value pair', function() {
        var one = collection.item('one', {content: 'foo'});
        var two = collection.item('two', {content: 'bar'});

        assert(one instanceof Item);
        assert(one instanceof collection.Item);
        assert.equal(one.path, 'one');
        assert(two instanceof Item);
        assert(two instanceof collection.Item);
        assert.equal(two.path, 'two');
      });

      it('should return a single collection item from an object', function() {
        var one = collection.item({path: 'one', content: 'foo'});
        var two = collection.item({path: 'two', content: 'bar'});

        assert(one instanceof Item);
        assert.equal(one.path, 'one');
        assert(two instanceof Item);
        assert.equal(two.path, 'two');
      });
    });

    describe('addItem', function() {
      beforeEach(function() {
        collection = new Collection();
      });

      it('should throw an error when args are invalid', function(cb) {
        try {
          collection.addItem(function() {});
          cb(new Error('expected an error'));
        } catch (err) {
          assert.equal(err.message, 'expected value to be an object.');
          cb();
        }
      });

      it('should add a item to `items`', function() {
        collection.addItem('foo');
        assert(collection.items.hasOwnProperty('foo'));

        collection.addItem('one', {content: '...'});
        assert.equal(typeof collection.items.one, 'object');
        assert(isBuffer(collection.items.one.contents));
      });

      it('should create an instance of `Item`', function() {
        collection.addItem('one', {content: '...'});
        assert(collection.items.one instanceof collection.Item);
      });

      it('should allow an `Item` constructor to be passed', function() {
        Item.prototype.foo = function(key, value) {
          this[key] = value;
        };
        collection = new Collection({Item: Item});
        collection.addItem('one', {content: '...'});
        collection.items.one.foo('bar', 'baz');
        assert.equal(collection.items.one.bar, 'baz');
      });

      it('should allow an instance of `Item` to be passed', function() {
        var collection = new Collection({Item: Item});
        var item = new Item({content: '...'});
        collection.addItem('one', item);
        item.set('abc', 'xyz');
        assert(collection.items.one instanceof collection.Item);
        assert(isBuffer(collection.items.one.contents));
        assert.equal(collection.items.one.abc, 'xyz');
      });
    });

    describe('deleteItem', function() {
      beforeEach(function() {
        collection = new Collection();
      });

      it('should delete an item from `items` by item instance', function() {
        collection.addItem('foo');
        assert(collection.items.hasOwnProperty('foo'));

        collection.addItem('one', {content: '...'});
        assert(collection.items.hasOwnProperty('one'));
        assert.equal(Object.keys(collection.items).length, 2);

        var foo = collection.getItem('foo');
        collection.deleteItem(foo);
        assert.equal(Object.keys(collection.items).length, 1);
      });

      it('should delete an item from `items` by item `key`', function() {
        collection.addItem('foo');
        assert(collection.items.hasOwnProperty('foo'));

        collection.addItem('one', {content: '...'});
        assert(collection.items.hasOwnProperty('one'));
        assert.equal(Object.keys(collection.items).length, 2);

        collection.deleteItem('foo');
        assert.equal(Object.keys(collection.items).length, 1);
      });
    });

    describe('addItems', function() {
      beforeEach(function() {
        collection = new Collection();
      });

      it('should add multiple items', function() {
        collection.addItems({
          one: {content: 'foo'},
          two: {content: 'bar'}
        });
        assert(isBuffer(collection.items.one.contents));
        assert(isBuffer(collection.items.two.contents));
      });

      it('should create items from an instance of Collection', function() {
        collection.addItems({
          one: {content: 'foo'},
          two: {content: 'bar'}
        });
        var pages = new Collection(collection);
        assert(isBuffer(pages.items.one.contents));
        assert(isBuffer(pages.items.two.contents));
      });

      it('should add an array of plain-objects', function() {
        collection.addItems([
          {path: 'one', content: 'foo'},
          {path: 'two', content: 'bar'}
        ]);
        assert(isBuffer(collection.items.one.contents));
        assert(isBuffer(collection.items.two.contents));
      });

      it('should add an array of items', function() {
        var list = new List([
          {path: 'one', content: 'foo'},
          {path: 'two', content: 'bar'}
        ]);

        collection.addItems(list.items);
        assert(isBuffer(collection.items.one.contents));
        assert(isBuffer(collection.items.two.contents));
      });
    });

    describe('addList', function() {
      beforeEach(function() {
        collection = new Collection();
      });

      it('should add a list of items', function() {
        collection.addList([
          {path: 'one', content: 'foo'},
          {path: 'two', content: 'bar'}
        ]);
        assert(isBuffer(collection.items.one.contents));
        assert(isBuffer(collection.items.two.contents));
      });

      it('should add a list of items from the constructor', function() {
        var list = new List([
          {path: 'one', content: 'foo'},
          {path: 'two', content: 'bar'}
        ]);

        collection = new Collection(list);
        assert(isBuffer(collection.items.one.contents));
        assert(isBuffer(collection.items.two.contents));
      });

      it('should throw an error when list is not an array', function() {
        var items = new Collection();
        var count = 0;
        try {
          items.addList();
          count++;
        } catch (err) {
          assert.equal(err.message, 'expected list to be an array.');
        }

        try {
          items.addList({});
          count++;
        } catch (err) {
          assert.equal(err.message, 'expected list to be an array.');
        }

        try {
          items.addList('foo');
          count++;
        } catch (err) {
          assert.equal(err.message, 'expected list to be an array.');
        }
        assert.equal(count, 0);
      });

      it('should load an array of items from an event', function() {
        var collection = new Collection();

        collection.on('addList', function(list) {
          while (list.length) {
            collection.addItem({path: list.pop()});
          }
        });

        collection.addList(['a.txt', 'b.txt', 'c.txt']);
        assert(collection.items.hasOwnProperty('a.txt'));
        assert.equal(collection.items['a.txt'].path, 'a.txt');
      });

      it('should load an array of items from the addList callback:', function() {
        var collection = new Collection();

        collection.addList(['a.txt', 'b.txt', 'c.txt'], function(fp) {
          return {path: fp};
        });
        assert(collection.items.hasOwnProperty('a.txt'));
        assert.equal(collection.items['a.txt'].path, 'a.txt');
      });
    });

    describe('getItem', function() {
      beforeEach(function() {
        collection = new Collection();
      });
      it('should get a item from `items`', function() {
        collection.addItem('one', {content: 'aaa'});
        collection.addItem('two', {content: 'zzz'});
        assert(isBuffer(collection.items.one.contents));
        assert(isBuffer(collection.getItem('one').contents));
        assert.equal(collection.getItem('one').contents.toString(), 'aaa');
        assert.equal(collection.getItem('two').contents.toString(), 'zzz');
      });
    });
  });

  describe('options', function() {
    describe('option', function() {
      beforeEach(function() {
        collection = new Collection();
      });

      it('should expose the `option` method', function() {
        collection.option('foo', 'bar');
        assert(collection.options.hasOwnProperty('foo', 'bar'));
      });

      it('should be chainable', function() {
        collection.option('foo', 'bar')
          .addItems('a.hbs')
          .addItems('b.hbs')
          .addItems('c.hbs');

        assert(collection.options.hasOwnProperty('foo', 'bar'));
        hasProperties(collection.items, [
          'a.hbs',
          'b.hbs',
          'c.hbs'
        ]);
      });

      it('should set a key/value pair on options', function() {
        collection.option('a', 'b');
        assert.equal(collection.options.a, 'b');
      });

      it('should set an object on options', function() {
        collection.option({c: 'd'});
        assert.equal(collection.options.c, 'd');
      });

      it('should get an option', function() {
        collection.option({c: 'd'});
        var c = collection.option('c');
        assert.equal(c, 'd');
      });
    });

    describe('options.renameKey', function() {
      beforeEach(function() {
        collection = new Collection({
          renameKey: function(key) {
            return path.basename(key);
          }
        });
      });

      it('should use a custom rename key function on item keys', function() {
        collection.addItem('a/b/c/d.hbs', {content: 'foo bar baz'});
        assert.equal(collection.items['d.hbs'].contents.toString(), 'foo bar baz');
      });

      it('should get a item with the renamed key', function() {
        collection.addItem('a/b/c/d.hbs', {content: 'foo bar baz'});
        assert.equal(collection.getItem('d.hbs').contents.toString(), 'foo bar baz');
      });

      it('should get a item with the original key', function() {
        collection.addItem('a/b/c/d.hbs', {content: 'foo bar baz'});
        assert.equal(collection.getItem('a/b/c/d.hbs').contents.toString(), 'foo bar baz');
      });
    });
  });

};
