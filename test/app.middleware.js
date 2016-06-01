'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('app.middleware', function() {
    beforeEach(function() {
      app = new App();
      app.engine('tmpl', require('engine-base'));
      app.create('pages');
    });

    it('should call the all method for every middleware method:', function() {
      var i = 0;
      app.all(/./, function(view, next) {
        assert.equal(typeof view.path, 'string');
        i++;
        next();
      });

      assert.equal(i, 0);
      app.page('foo.tmpl', {content: 'foo'});
      assert.equal(i, 1);
    });

    it('should call the onLoad method when a view is loaded:', function() {
      var i = 0;
      app.onLoad(/./, function(view, next) {
        assert.equal(typeof view.path, 'string');
        i++;
        next();
      });

      assert.equal(i, 0);
      app.page('foo.tmpl', {content: 'foo'});
      assert.equal(i, 1);
    });

    it('should emit an event when a handler is called:', function(cb) {
      var i = 0;
      app.on('onLoad', function() {
        i++;
      });
      app.on('preRender', function() {
        i++;
      });
      app.on('preCompile', function() {
        i++;
      });

      app.page('foo.tmpl', {content: 'foo'})
        .render(function(err) {
          if (err) return cb(err);
          assert.equal(i, 3);
          cb();
        });
    });
  });
};
