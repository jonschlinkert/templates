'use strict';

require('mocha');
require('should');
var assert = require('assert');
var support = require('./support');
var App = support.resolve();
var Views = App.Views;
var View = App.View;
var collection;

describe('views.getView', function() {
  beforeEach(function() {
    collection = new Views();
  });

  it('should pass to view `use` if a function is returned:', function() {
    collection.addView('one.txt', {content: '...'});
    collection.addView('two.txt', {content: '...'});
    collection.addView('three.txt', {content: '...'});

  });
});
