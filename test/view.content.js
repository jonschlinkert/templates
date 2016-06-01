'use strict';

var fs = require('fs');
var assert = require('assert');
var path = require('path');
var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

module.exports = function(App, options, runner) {
  var app;

  describe('view.content', function() {
    beforeEach(function() {
      app = new App();
      app.create('page');
      app.engine('tmpl', require('engine-base'));
    });

    it('should normalize the `content` property on a view to a string:', function(cb) {
      app.page('abc', {path: fixtures('templates/a.tmpl')})
        .set('read', function() {
          this.contents = fs.readFileSync(this.path);
          return this;
        });

      app.views.pages.abc.read();

      assert('content' in app.views.pages.abc);
      assert.equal(typeof app.views.pages.abc.content, 'string');
      cb();
    });
  });
};
