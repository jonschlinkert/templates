require('mocha');
require('should');
var assert = require('assert');
var App = require('..');
var Collection = App.Collection;
var collection;

describe('collection', function () {
  describe('method', function () {
    beforeEach(function () {
      collection = new Collection();
    });

    it('should expose the collection method', function () {
      assert(typeof Collection === 'function');
    });

    it('should return a new collection', function () {
      var collection = new Collection();
      assert(typeof collection === 'object');
    });

    it('should have isCollection property', function () {
      var collection = new Collection();
      assert(collection.isCollection === true);
    });
  });

  describe('adding items', function () {
    beforeEach(function () {
      collection = new Collection();
    });

    it('should load a view onto the respective collection:', function () {
      collection.addItem('a.hbs');
      collection.items.should.have.property('a.hbs');
    });

    it('should allow collection methods to be chained:', function () {
      collection
        .addItems({'a.hbs': {path: 'a.hbs'}})
        .addItems({'b.hbs': {path: 'b.hbs'}})
        .addItems({'c.hbs': {path: 'c.hbs'}});

      collection.items.should.have.properties([
        'a.hbs',
        'b.hbs',
        'c.hbs'
      ]);
    });

    it('should expose the `option` method:', function () {
      collection.option('foo', 'bar')
        .addItems('a.hbs')
        .addItems('b.hbs')
        .addItems('c.hbs');

      collection.options.should.have.property('foo', 'bar');
      collection.items.should.have.properties([
        'a.hbs',
        'b.hbs',
        'c.hbs'
      ]);
    });
  });

  describe('queue', function () {
    beforeEach(function () {
      collection = new Collection();
    });

    it('should emit arguments on addItem:', function (done) {
      collection.on('addItem', function (a, b, c, d, e) {
        assert(a === 'a');
        assert(b === 'b');
        assert(c === 'c');
        assert(d === 'd');
        assert(e === 'e');
        done();
      });

      collection.addItem('a', 'b', 'c', 'd', 'e');
    });

    it('should expose the `queue` property for loading items:', function () {
      collection.queue.push(collection.item('b', {path: 'b'}));

      collection.addItem('a', {path: 'a'});
      assert(collection.items.hasOwnProperty('a'));
      assert(collection.items.hasOwnProperty('b'));
    });

    it('should load all items on the queue when addItem is called:', function () {
      collection.on('addItem', function (key, value) {
        collection.queue.push(collection.item(key, {content: value}));
      });

      collection.addItem('a.html', 'aaa');
      collection.addItem('b.html', 'bbb');
      collection.addItem('c.html', 'ccc');

      assert(collection.items.hasOwnProperty('a.html'));
      assert(collection.getItem('a.html').content === 'aaa');
      assert(collection.items.hasOwnProperty('b.html'));
      assert(collection.getItem('b.html').content === 'bbb');
      assert(collection.items.hasOwnProperty('c.html'));
      assert(collection.getItem('c.html').content === 'ccc');
    });

    it('should expose the `option` method:', function () {
      collection.option('foo', 'bar')
        .addItems('a.hbs')
        .addItems('b.hbs')
        .addItems('c.hbs');

      collection.options.should.have.property('foo', 'bar');
      collection.items.should.have.properties([
        'a.hbs',
        'b.hbs',
        'c.hbs'
      ]);
    });
  });
});
