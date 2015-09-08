var path = require('path');
var assert = require('assert');
require('should');
require('mocha');
var View = require('../lib/view');
var view;

describe.skip('helpers', function () {
  describe('rendering', function () {
    beforeEach(function () {
      view = new View();
    });

    it('should use helpers to render a view:', function (done) {
      var locals = {name: 'Halle'};

      view.helper('upper', function (str) {
        return str.toUpperCase(str);
      });

      var buffer = new Buffer('a <%= upper(name) %> b')
      view.page('a.tmpl', {contents: buffer, locals: locals})
        .render(function (err, res) {
          if (err) return done(err);

          assert(res.contents.toString() === 'a HALLE b');
          done();
        });
    });
  });
});

