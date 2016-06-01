'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');
var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

module.exports = function(App, options, runner) {
  var app;

  var resolve = require('resolve-glob');

  describe('app.lookups', function() {
    beforeEach(function() {
      app = new App();
      var files = resolve.sync(path.resolve(__dirname, 'fixtures/templates/*.tmpl'));

      app.option('renameKey', function(key) {
        return path.basename(key);
      });

      app.create('pages');
      files.forEach(function(file) {
        app.pages.addView({path: file, contents: fs.readFileSync(file)});
      });
    });

    describe('getView', function() {
      it('should find a view', function() {
        var view = app.getView('pages', 'a.tmpl');
        assert.equal(typeof view.path, 'string');
      });

      it('should find a view using the renameKey function', function() {
        var view = app.getView('pages', fixtures('templates/a.tmpl'));
        assert.equal(typeof view.path, 'string');
      });

      it('should return undefined when nothing is found', function() {
        var view = app.getView('pages', fixtures('templates/foo.tmpl'));
        assert.equal(typeof view, 'undefined');
      });

      it('should return undefined when name is a directory', function() {
        var view = app.getView('pages', fixtures('templates'));
        assert.equal(typeof view, 'undefined');
      });

      it('should find a view using a glob pattern', function() {
        var view = app.getView('pages', 'a', function(key) {
          return key + '.tmpl';
        });
        assert.equal(typeof view.path, 'string');
      });
    });

    describe('getViews', function() {
      it('should return the collection object if passed:', function() {
        var views = app.getViews(app.views.pages);
        assert(Object.keys(views).length > 1);
      });

      it('should return the specified collection with the plural name:', function() {
        var views = app.getViews('pages');
        assert(Object.keys(views).length > 1);
      });

      it('should return the specified collection with the singular name:', function() {
        var views = app.getViews('page');
        assert(Object.keys(views).length > 1);
      });

      it('should return null when the collection is not found:', function(cb) {
        try {
          app.getViews('nada');
          cb(new Error('expected an error'));
        } catch (err) {
          assert.equal(err.message, 'getViews cannot find collection: nada');
          cb();
        }
      });
    });

    describe('find', function() {
      it('should return null when a view is not found:', function(cb) {
        try {
          app.find({});
          cb(new Error('expected an error'));
        } catch (err) {
          assert.equal(err.message, 'expected name to be a string.');
          cb();
        }
      });

      it('should find a view by collection name:', function() {
        var view = app.find('a.tmpl', 'pages');
        assert.equal(typeof view.path, 'string');
      });

      it('should find a view by collection name:', function() {
        app = new App();
        app.option('renameKey', function(key) {
          return path.basename(key);
        });
        app.create('pages');
        app.page('a/b/c.md', {content: '...'});
        var view = app.find('a/b/c.md');
        assert.equal(typeof view.path, 'string');
      });

      it('should find a view without a collection name:', function() {
        var view = app.find('a.tmpl');
        assert.equal(typeof view.path, 'string');
      });
    });
  });
};
