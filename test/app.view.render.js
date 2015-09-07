/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var App = require('../');
var app;

describe('helpers', function () {
  describe('rendering', function () {
    beforeEach(function () {
      app = new App();
      app.engine('tmpl', require('engine-lodash'));
      app.create('page');
    });

    it('should use helpers to render a view:', function (done) {
      var locals = {name: 'Halle'};

      app.helper('upper', function (str) {
        return str.toUpperCase(str);
      });

      var buffer = new Buffer('a <%= upper(name) %> b')
      app.page('a.tmpl', {contents: buffer, locals: locals})
        .render(function (err, res) {
          if (err) return done(err);

          assert(res.contents.toString() === 'a HALLE b');
          done();
        });
    });
  });
});

