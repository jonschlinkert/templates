'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  var List = App.List;
  var list;

  describe('list.deleteItem', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should delete an item from `items` when the key is passed', function() {
      list.addItem('a', {content: '...'});
      list.addItem('b', {content: '...'});
      list.addItem('c', {content: '...'});
      assert.equal(list.items.length, 3);

      var a = list.getItem('a');
      list.deleteItem(a);
      assert.equal(list.items.length, 2);

      var c = list.getItem('c');
      list.deleteItem(c);
      assert.equal(list.items.length, 1);
    });

    it('should delete an item when the item instance is passed', function() {
      list.addItem('a', {content: '...'});
      list.addItem('b', {content: '...'});
      list.addItem('c', {content: '...'});
      assert.equal(list.items.length, 3);

      var a = list.getItem('a');
      list.deleteItem(a);
      assert.equal(list.keys.length, 2);
    });

    it('should delete the key from `keys` when an item is deleted', function() {
      list.addItem('a', {content: '...'});
      list.addItem('b', {content: '...'});
      list.addItem('c', {content: '...'});
      assert.equal(list.items.length, 3);

      var a = list.getItem('a');
      list.deleteItem(a);
      assert.equal(list.keys.length, 2);

      list.deleteItem('c');
      assert.equal(list.keys.length, 1);

      assert.equal(list.items[0].key, 'b');
    });

    it('should remove an item from `items` by key', function() {
      list.addItem('a', {content: '...'});
      list.addItem('b', {content: '...'});
      list.addItem('c', {content: '...'});
      assert.equal(list.items.length, 3);
      list.deleteItem('c');
      assert.equal(list.items.length, 2);
      list.deleteItem('b');
      assert.equal(list.items[0].key, 'a');
    });

    it('should do nothing when the item does not exist', function() {
      assert(list.deleteItem('slfjslslks'));
    });
  });

};
