/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
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
      app.engine('tmpl', require('engine-lodash'));
      app.create('page');
    });

    it('should add a view to the created collection:', function () {
      app.page('test/fixtures/pages/a.hbs');
      assert(typeof app.views.pages['test/fixtures/pages/a.hbs'] === 'object');
    });

    it('should support chaining:', function () {
      app
        .page('test/fixtures/pages/a.hbs')
        .page('test/fixtures/pages/b.hbs')
        .page('test/fixtures/pages/c.hbs');

      app.views.pages.should.have.properties([
        'test/fixtures/pages/a.hbs',
        'test/fixtures/pages/b.hbs',
        'test/fixtures/pages/c.hbs'
      ]);
    });

    it('should expose the `option` method:', function () {
      app.page.option('foo', 'bar')
        .page('test/fixtures/pages/a.hbs')
        .page('test/fixtures/pages/b.hbs')
        .page('test/fixtures/pages/c.hbs');

      app.page.options.should.eql({foo: 'bar'});
      app.views.pages.should.have.properties([
        'test/fixtures/pages/a.hbs',
        'test/fixtures/pages/b.hbs',
        'test/fixtures/pages/c.hbs'
      ]);
    });
  });
});
