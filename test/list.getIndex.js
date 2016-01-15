'use strict';

require('mocha');
require('should');
var path = require('path');
var assert = require('assert');
var support = require('./support');
var App = support.resolve();
var List = App.List;
var list;

describe('list.getIndex', function() {
  beforeEach(function() {
    list = new List();
    list.items = [];
  });

  it('should get the index of a key when key is not renamed', function() {
    list.addItem('a/b/c/ddd.hbs', {content: 'ddd'});
    list.addItem('a/b/c/eee.hbs', {content: 'eee'});
    assert(list.getIndex('a/b/c/ddd.hbs') === 0);
    assert(list.getIndex('a/b/c/eee.hbs') === 1);
  });

  it('should get the index by path', function() {
    list.addItem('d.md', {path: 'a/b/c/d.md', content: 'ddd'});
    assert(list.getIndex('a/b/c/d.md') === 0);
  });

  it('should get the index by relative path', function() {
    list.addItem('d.md', {path: 'a/b/c/d.md', content: 'ddd', base: 'a/b'});
    assert(list.getIndex('c/d.md') === 0);
  });

  it('should get the index by stem', function() {
    list.addItem('d.md', {path: 'a/b/c/d.md', content: 'ddd', base: 'a/b'});
    assert(list.getIndex('d') === 0);
  });

  it('should get the index by basename', function() {
    list.addItem('a/b/c/d.md', {path: 'a/b/c/d.md', content: 'ddd', base: 'a/b'});
    assert(list.getIndex('d.md') === 0);
  });

  it('should get the index by key', function() {
    list.addItem('d.md', {path: 'a/b/c/d.md', content: 'ddd', base: 'a/b'});
    list.getItem('d.md').key = 'foo';
    assert(list.getIndex('foo') === 0);
  });

  it('should get the index of a key for dotfiles', function() {
    list.addItem('.gitignore', {content: 'ddd'});
    assert(list.getIndex('.gitignore') === 0);
  });

  it('should return null when argument is undefined', function() {
    list.addItem('.gitignore', {content: 'ddd'});
    assert(list.getIndex(undefined) === null);
    assert(list.getIndex() === null);
  });

  it('should get the correct index for dotfiles', function() {
    list.addItem('.DS_Store', {content: '...'});
    list.addItem('.gitignore', {content: 'ddd'});
    list.addItem('.zzz', {content: '...'});
    assert(list.getIndex('.gitignore') === 1);
  });

  it('should get the correct index for dotfiles by their extensions', function() {
    list.addItem('a/b/c/.DS_Store', {content: '...'});
    list.addItem('a/b/c/.gitignore', {content: 'ddd'});
    list.addItem('a/b/c/.zzz', {content: '...'});
    assert(list.getIndex('.gitignore') === 1);
  });

  it('should get the correct index for dotfiles by their paths', function() {
    list.addItem('a/b/c/.DS_Store', {content: '...'});
    list.addItem('a/b/c/.gitignore', {content: 'ddd'});
    list.addItem('a/b/c/.zzz', {content: '...'});
    assert(list.getIndex('a/b/c/.gitignore') === 1);
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

