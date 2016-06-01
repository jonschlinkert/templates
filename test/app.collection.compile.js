'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  var Views = App.Views;
  var views;

  describe('app.collection.compile', function() {
    beforeEach(function() {
      views = new Views();
    });

    it('should throw an error when an engine cannot be found:', function(cb) {
      views.addView('foo.bar', {content: '<%= name %>'});
      var page = views.getView('foo.bar');
      try {
        views.compile(page);
        cb(new Error('expected an error'));
      } catch (err) {
        assert.equal(err.message, 'Views#compile cannot find an engine for: .bar');
        cb();
      }
    });

    it('should compile a template:', function() {
      views.engine('tmpl', require('engine-base'));
      views.addView('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', a: 'b'});

      var page = views.getView('a.tmpl');
      var view = views.compile(page);
      assert.equal(typeof view.fn, 'function');
    });

    it('should compile a template by name:', function() {
      views.engine('tmpl', require('engine-base'));
      views.addView('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', a: 'b'});

      var view = views.compile('a.tmpl');
      assert.equal(typeof view.fn, 'function');
    });

    it('should throw an error when a callback is given:', function() {
      views.engine('md', require('engine-base'));
      views.addView('foo.md', {content: '<%= name %>'});
      var page = views.getView('foo.md');
      var count = 0;

      try {
        views.compile(page, function() {});
        count++;
      } catch (err) {
        assert.equal(err.message, 'Views#compile is sync and does not take a callback function');
      }

      try {
        views.compile(page, {}, function() {});
        count++;
      } catch (err) {
        assert.equal(err.message, 'Views#compile is sync and does not take a callback function');
      }

      assert.equal(count, 0);
    });
  });
};
