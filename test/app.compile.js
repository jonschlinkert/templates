'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('app.compile', function() {
    beforeEach(function() {
      app = new App();
      app.create('page');
    });

    it('should throw an error when an engine cannot be found:', function(cb) {
      app.page('foo.bar', {content: '<%= name %>'});
      var page = app.pages.getView('foo.bar');

      try {
        app.compile(page);
        cb(new Error('expected an error'));
      } catch (err) {
        assert.equal(err.message, 'Templates#compile cannot find an engine for: .bar');
        cb();
      }
    });

    it('should compile a template:', function() {
      app.engine('tmpl', require('engine-base'));
      app.pages('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', a: 'b'});

      var page = app.pages.getView('a.tmpl');
      var view = app.compile(page);
      assert.equal(typeof view.fn, 'function');
    });

    it('should compile a template by name:', function() {
      app.engine('tmpl', require('engine-base'));
      app.pages('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', a: 'b'});

      var view = app.compile('a.tmpl');
      assert.equal(typeof view.fn, 'function');
    });

    it('should throw an error when a callback is given:', function() {
      app.engine('md', require('engine-base'));
      app.page('foo.md', {content: '<%= name %>'});
      var page = app.pages.getView('foo.md');
      var count = 0;

      try {
        app.compile(page, function() {});
        count++;
      } catch (err) {
        assert.equal(err.message, 'Templates#compile is sync and does not take a callback function');
      }

      try {
        app.compile(page, {}, function() {});
        count++;
      } catch (err) {
        assert.equal(err.message, 'Templates#compile is sync and does not take a callback function');
      }

      assert.equal(count, 0);
    });
  });
};
