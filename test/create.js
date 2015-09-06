/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var App = require('../');
var app;


describe('create', function () {
  describe('method', function () {
    beforeEach(function () {
      app = new App();
    });

    it('should expose the create method', function () {
      assert(typeof app.create === 'function');
    });

    it('should add a collection to `views`', function () {
      app.create('pages');
      assert(typeof app.views.pages === 'object');
    });

    it('should add a pluralized collection to `views`', function () {
      app.create('page');
      assert(typeof app.views.pages === 'object');
    });
  });

  describe('chaining', function () {
    beforeEach(function () {
      app = new App();
      app.engine('tmpl', require('engine-lodash'));
      app.create('page');
    });

    it('should create views from key-value pairs:', function () {
      app.page('a.hbs', {contents: new Buffer('a')});
      app.page('b.hbs', {contents: new Buffer('b')});
      app.page('c.hbs', {contents: new Buffer('c')});
      app.views.pages.should.have.properties(['a.hbs', 'b.hbs', 'c.hbs']);
      assert(app.views.pages['a.hbs'].contents.toString() === 'a');
    });

    it('should create views from file paths:', function () {
      app.page('test/fixtures/pages/a.hbs');
      app.page('test/fixtures/pages/b.hbs');
      app.page('test/fixtures/pages/c.hbs');

      app.views.pages.should.have.properties([
        'test/fixtures/pages/a.hbs',
        'test/fixtures/pages/b.hbs',
        'test/fixtures/pages/c.hbs'
      ]);
    });
  });
});
