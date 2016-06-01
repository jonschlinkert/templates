'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  function append(str) {
    return function(view, next) {
      var content = view.contents.toString();
      view.contents = new Buffer(content + ' ' + str);
      next();
    };
  }
  function prepend(str) {
    return function(view, next) {
      var content = view.contents.toString();
      view.contents = new Buffer(str + ' ' + content);
      next();
    };
  }

  describe('routes', function() {
    beforeEach(function() {
      app = new App();
      app.engine('tmpl', require('engine-base'));
      app.create('page');
    });

    describe('params', function() {
      it('should call param function when routing', function(cb) {
        app.param('id', function(view, next, id) {
          assert.equal(id, '123');
          next();
        });

        app.all('/foo/:id/bar', function(view, next) {
          assert.equal(view.options.params.id, '123');
          next();
        });

        app.router.handle({ path: '/foo/123/bar' }, cb);
      });
    });

    describe('onLoad middleware', function() {
      it('should run when templates are loaded:', function() {
        app.onLoad(/\.tmpl/, prepend('onLoad'));
        app.pages('a.tmpl', { path: 'a.tmpl', content: '<%= name %>'});

        var page = app.pages.getView('a.tmpl');
        assert.equal(page.contents.toString(), 'onLoad <%= name %>');
      });
    });

    describe('preCompile middleware', function() {
      it('should run before templates are compiled:', function() {

      });
    });

    describe('postCompile middleware', function() {
      it('should run after templates are compiled:', function() {

      });
    });

    describe('preRender middleware', function() {
      it('should run before templates are rendered:', function(cb) {
        app.preRender(/\.tmpl/, prepend('preRender'));
        app.pages('a.tmpl', { path: 'a.tmpl', content: '<%= name %>', locals: {name: 'aaa'} });

        var page = app.pages.getView('a.tmpl');
        assert.equal(page.contents.toString(), '<%= name %>');

        page.render({}, function(err, res) {
          if (err) return cb(err);
          assert.equal(res.contents.toString(), 'preRender aaa');
          cb();
        });
      });
    });

    describe('postRender middleware', function() {
      it('should run after templates are rendered:', function(cb) {
        app.postRender(/\.tmpl/, append('postRender'));
        app.pages('a.tmpl', { path: 'a.tmpl', content: '<%= name %>', locals: {name: 'aaa' }});

        var page = app.pages.getView('a.tmpl');
        assert.equal(page.contents.toString(), '<%= name %>');

        page.render({}, function(err, res) {
          if (err) return cb(err);
          assert.equal(res.contents.toString(), 'aaa postRender');
          cb();
        });
      });
    });
  });
};
