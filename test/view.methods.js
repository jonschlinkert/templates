'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('view.methods', function() {
    beforeEach(function() {
      app = new App();
      app.engine('tmpl', require('engine-base'));
      app.create('page');
    });

    describe('.use', function() {
      it('should expose `.use` for running plugins on a view:', function() {
        app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>'})
          .use(function() {
            this.options.foo = 'bar';
          })
          .use(function() {
            this.options.bar = 'baz';
          });

        var page = app.pages.getView('a.tmpl');
        assert(page.options.hasOwnProperty('foo'));
        assert(page.options.hasOwnProperty('bar'));
      });
    });

    describe('.render:', function() {
      it('should expose `.render` for rendering a view:', function(cb) {
        app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', locals: {a: 'bbb'}})
          .render({}, function(err, res) {
            if (err) return cb(err);
            assert.equal(res.contents.toString(), 'bbb');
            cb();
          });
      });
    });
  });
};
