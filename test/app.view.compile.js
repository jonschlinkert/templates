'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('app.view.compile', function() {
    describe('compile method', function() {
      beforeEach(function() {
        app = new App();
        app.engine('tmpl', require('engine-base'));
        app.create('page');
      });

      it('should compile a view:', function() {
        var buffer = new Buffer('a b c');
        var view = app.page('a.tmpl', {contents: buffer})
          .compile();
        assert.equal(typeof view.fn, 'function');
      });

      it('should compile a view with settings:', function() {
        var buffer = new Buffer('a b c');
        var view = app.page('a.tmpl', {contents: buffer})
          .compile({foo: 'bar'});
        assert.equal(typeof view.fn, 'function');
      });

      it('should compile a view with isAsync flag:', function() {
        var buffer = new Buffer('a b c');
        var view = app.page('a.tmpl', {contents: buffer})
          .compile(true);
        assert.equal(typeof view.fn, 'function');
      });

      it('should compile a view without a collection:', function() {
        var buffer = new Buffer('a b c');
        var view = app.view('a.tmpl', {contents: buffer})
          .compile({foo: 'bar'});
        assert.equal(typeof view.fn, 'function');
      });

      it('should compile a view without a collection through `app.compile`:', function() {
        var buffer = new Buffer('a b c');
        var view = app.view('a.tmpl', {contents: buffer});
        app.compile(view, {foo: 'bar'});
        assert.equal(typeof view.fn, 'function');
      });
    });
  });

};
