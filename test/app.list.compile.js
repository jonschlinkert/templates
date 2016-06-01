'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  var List = App.List;
  var list;

  describe('app.list.compile', function() {
    beforeEach(function() {
      list = new List();
      list.engine('tmpl', require('engine-base'));
    });

    it('should compile an item:', function() {
      var buffer = new Buffer('a b c');
      var item = list.addItem('a.tmpl', {contents: buffer})
        .compile();

      assert.equal(typeof item.fn, 'function');
    });

    it('should use the compiled function to render:', function() {
      var buffer = new Buffer('a <%= title %> c');
      var item = list.addItem('a.tmpl', {contents: buffer})
        .compile();

      assert(item.fn({title: 'z'}));
      assert.equal(typeof item.fn({title: 'z'}), 'string');
      assert.equal(item.fn({title: 'z'}), 'a z c');
    });

    it('should compile a view by name:', function() {
      var buffer = new Buffer('a <%= title %> c');
      list.addItem('a.tmpl', {contents: buffer});

      var item = list.compile('a.tmpl');

      assert(item.fn({title: 'z'}));
      assert.equal(typeof item.fn({title: 'z'}), 'string');
      assert.equal(item.fn({title: 'z'}), 'a z c');
    });
  });

};
