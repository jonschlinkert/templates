'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('app.handle', function() {
    beforeEach(function() {
      app = new App();
      app.create('pages');
      app.handlers(['foo']);
    });

    it('should support custom handle methods:', function(cb) {
      var page = app.page('foo', {contents: null});

      app.handleOnce('foo', page, function(err, view) {
        if (err) return cb(err);

        assert.equal(typeof view.path, 'string');
        cb();
      });
    });

    it('should not blow up if `options.handled` does not exist:', function(cb) {
      var page = app.page('foo', {contents: null});
      delete page.options.handled;

      app.handleOnce('foo', page, function(err, view) {
        if (err) return cb(err);

        assert.equal(typeof view.path, 'string');
        cb();
      });
    });
  });
};
