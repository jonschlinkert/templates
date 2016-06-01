'use strict';

var fs = require('fs');
var assert = require('assert');
var path = require('path');
var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

module.exports = function(App, options, runner) {
  var app;

  describe('view.set', function() {
    beforeEach(function() {
      app = new App();
      app.create('page');
      app.engine('tmpl', require('engine-base'));
    });

    it('should set a property on a view:', function(cb) {
      app.page('abc', {path: fixtures('templates/a.tmpl')})
        .set('read', function() {
          this.contents = fs.readFileSync(this.path);
          return this;
        });

      assert('read' in app.views.pages.abc);
      app.views.pages.abc
        .read()
        .set('data.name', 'Brooke')
        .render(function(err, res) {
          if (err) return cb(err);
          assert.equal(res.content, 'Brooke');
          cb();
        });
    });
  });
};
