require('mocha');
require('should');
var assert = require('assert');
var App = require('../');
var app;

describe('app.options', function () {
  beforeEach(function () {
    app = new App();
    app.initialize();
  });

  describe('extendView', function () {
    it('should use extendView function passed on options:', function () {
      app.option('extendView', function (view) {
        view.foo = 'bar';
      });

      assert(typeof app.options.extendView === 'function');
      var view = app.view({path: 'a', content: 'b'});
      assert(view.foo === 'bar');
    });
  });
});
