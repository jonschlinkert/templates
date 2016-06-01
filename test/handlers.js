'use strict';

var path = require('path');
var assert = require('assert');
var rimraf = require('rimraf');
var File = require('vinyl');

module.exports = function(App, options, runner) {
  var app;

  describe('handlers', function() {
    describe('custom handlers', function() {
      beforeEach(function() {
        app = new App();
        app.create('page');
      });

      it('should add custom middleware handlers:', function() {
        app.handler('foo');
        app.handler('bar');

        app.pages.use(function() {
          return function(view) {
            app.handle('foo', view);
            app.handle('bar', view);
          };
        });

        app.foo(/a/, function(view, next) {
          view.one = 'aaa';
          next();
        });

        app.bar(/z/, function(view, next) {
          view.two = 'zzz';
          next();
        });

        app.pages('a.txt', {content: 'aaa'});
        app.pages('z.txt', {content: 'zzz'});

        assert(app.pages.getView('a.txt').hasOwnProperty('one'));
        assert(!app.pages.getView('a.txt').hasOwnProperty('two'));

        assert(!app.pages.getView('z.txt').hasOwnProperty('one'));
        assert(app.pages.getView('z.txt').hasOwnProperty('two'));
      });
    });
  });
};
