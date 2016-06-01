'use strict';

var fs = require('fs');
var path = require('path');
var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  var resolve = require('resolve-glob');

  function decorateViews(views) {
    var fn = views.decorateView;
    views.decorateView = function() {
      var view = fn.apply(fn, arguments);
      view.read = function() {
        if (!this.contents) {
          this.contents = fs.readFileSync(this.path);
        }
      };
      return view;
    };
    views.loader = function(pattern) {
      var files = resolve.sync(pattern);
      return files.reduce(function(acc, fp) {
        acc[fp] = {path: fp};
        return acc;
      }, {});
    };
    return views;
  }

  describe('app.handlers', function() {
    describe('custom handlers', function() {
      beforeEach(function() {
        app = new App();
        app.create('pages')
          .use(decorateViews)
          .option('renameKey', function(key) {
            return path.basename(key);
          });
      });

      it('should add custom middleware handlers:', function() {
        app.handler('foo');
        assert(app.router.hasOwnProperty('foo'));
        assert.equal(typeof app.router.foo, 'function');
      });

      it('should add custom middleware handlers:', function() {
        app.handler('foo');
        app.handler('bar');

        app.foo(/./, function(view, next) {
          view.one = 'aaa';
          next();
        });

        app.bar(/./, function(view, next) {
          view.two = 'zzz';
          next();
        });

        app.page('abc', {content: '...'})
          .use(function(view) {
            app.handleView('foo', view);
            app.handleView('bar', view);
          });

        assert(app.views.pages.abc.hasOwnProperty('one', 'aaa'));
        assert(app.views.pages.abc.hasOwnProperty('two', 'zzz'));
      });
    });
  });
};
