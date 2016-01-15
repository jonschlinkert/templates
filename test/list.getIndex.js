require('mocha');
require('should');
var assert = require('assert');
var support = require('./support');
var App = support.resolve();
var List = App.List;
var list;

describe('list.getIndex', function() {
  beforeEach(function() {
    list = new List();
  });
  it('should get the index of a key when key is not renamed', function() {
    list.addItem('a/b/c/ddd.hbs', {content: 'ddd'});
    list.addItem('a/b/c/eee.hbs', {content: 'eee'});
    assert(list.getIndex('a/b/c/ddd.hbs') === 0);
    assert(list.getIndex('a/b/c/eee.hbs') === 1);
  });

  it('should get the index of a key when key is renamed', function() {
    list = new List({
      renameKey: function(key) {
        return path.basename(key);
      }
    });
    list.addItem('a/b/c/ddd.hbs', {content: 'ddd'});
    list.addItem('a/b/c/eee.hbs', {content: 'eee'});
    assert(list.getIndex('a/b/c/ddd.hbs') === 0);
    assert(list.getIndex('ddd.hbs') === 0);
    assert(list.getIndex('a/b/c/eee.hbs') === 1);
    assert(list.getIndex('eee.hbs') === 1);
  });
});

