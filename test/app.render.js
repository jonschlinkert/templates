require('should');
require('mocha');
var path = require('path');
var assert = require('assert');
var App = require('../');
var app;

describe('helpers', function () {
  describe('rendering', function () {
    beforeEach(function () {
      app = new App();
      app.engine('tmpl', require('engine-base'));
      app.create('page');
    });

    it('should use helpers to render a view:', function (done) {
      var locals = {name: 'Halle'};

      app.helper('upper', function (str) {
        return str.toUpperCase(str);
      });

      app.page('a.tmpl', {contents: new Buffer('a <%= upper(name) %> b'), locals: locals})
      var page = app.pages.getView('a.tmpl');

      app.render(page, function (err, res) {
        if (err) return done(err);

        assert(res.contents.toString() === 'a HALLE b');
        done();
      });
    });

    it('should use layouts when render a view:', function (done) {
      var locals = {name: 'Halle'};

      app.helper('upper', function (str) {
        return str.toUpperCase(str);
      });

      app.page('a.tmpl', {contents: new Buffer('a <%= upper(name) %> b'), locals: locals})
      var page = app.pages.getView('a.tmpl');

      app.render(page, function (err, res) {
        if (err) return done(err);

        assert(res.contents.toString() === 'a HALLE b');
        done();
      });
    });
  });
});

