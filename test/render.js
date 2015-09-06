/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var App = require('../');
var app;

describe('render', function () {
  describe('chaining', function () {
    beforeEach(function () {
      app = new App();
      app.engine('tmpl', require('engine-lodash'));
      app.create('page');
    });

    it('should render a view from an object:', function (done) {
      var locals = {name: 'Halle'};
      app.page('a.tmpl', {contents: new Buffer('a <%= name %> b'), locals: locals})
        .render(function (err, res) {
          if (err) return done(err);
          assert(res.contents.toString() === 'a Halle b');
          done();
        });
    });
  });
});
