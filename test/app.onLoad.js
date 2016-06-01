'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('app.onLoad', function() {
    beforeEach(function() {
      app = new App();
    });

    describe('app.collection', function() {
      it('should emit an onLoad when view is created', function(cb) {
        var collection = app.collection();

        app.on('onLoad', function(view) {
          assert.equal(view.path, 'blog/foo.js');
          cb();
        });

        app.onLoad('blog/:title', function(view, next) {
          assert.equal(view.path, 'blog/foo.js');
          next();
        });

        collection.addView('whatever', {path: 'blog/foo.js', content: 'bar baz'});
      });
    });

    describe('view collections', function() {
      it('should emit an onLoad when view is created', function(cb) {
        app.create('posts');

        app.on('onLoad', function(view) {
          assert.equal(view.path, 'blog/foo.js');
          cb();
        });

        app.onLoad('blog/:title', function(view, next) {
          assert.equal(view.path, 'blog/foo.js');
          next();
        });

        app.post('whatever', {path: 'blog/foo.js', content: 'bar baz'});
      });
    });
  });
};
