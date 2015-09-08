var path = require('path');
var assert = require('assert');
require('should');
require('mocha');
var App = require('../');
var app;


describe('collection singular method', function () {
  describe('create', function () {
    beforeEach(function () {
      app = new App();
    });

    it('should add a pluralized collection from singular name', function () {
      app.create('page');
      assert(typeof app.views.pages === 'object');
    });
  });

  describe('adding views', function () {
    beforeEach(function () {
      app = new App();
      app.engine('tmpl', require('engine-base'));
      app.create('page');
    });

    it('should add a view to the created collection:', function () {
      app.page('test/fixtures/pages/a.hbs');
      assert(typeof app.views.pages['test/fixtures/pages/a.hbs'] === 'object');
    });

    it('should expose the `option` method:', function () {
      app.pages.option('foo', 'bar')
      app.pages.options.should.have.property('foo', 'bar');
    });
  });
});
