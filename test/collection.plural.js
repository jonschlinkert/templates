/* deps: mocha */
var fs = require('fs');
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

  describe('adding views', function () {
    beforeEach(function () {
      app = new App();
      app.engine('tmpl', require('engine-lodash'));
      app.create('pages');
    });

    it('should load a view onto the respective collection:', function () {
      app.pages('test/fixtures/pages/a.hbs');
      app.views.pages.should.have.property('test/fixtures/pages/a.hbs');
    });

    it('should allow collection methods to be chained:', function () {
      app
        .pages('test/fixtures/pages/a.hbs')
        .pages('test/fixtures/pages/b.hbs')
        .pages('test/fixtures/pages/c.hbs');

      app.views.pages.should.have.properties([
        'test/fixtures/pages/a.hbs',
        'test/fixtures/pages/b.hbs',
        'test/fixtures/pages/c.hbs'
      ]);
    });

    it('should expose the `option` method:', function () {
      app.pages.option('foo', 'bar')
        .pages('test/fixtures/pages/a.hbs')
        .pages('test/fixtures/pages/b.hbs')
        .pages('test/fixtures/pages/c.hbs');

      app.pages.options.should.have.property('foo', 'bar');
      app.views.pages.should.have.properties([
        'test/fixtures/pages/a.hbs',
        'test/fixtures/pages/b.hbs',
        'test/fixtures/pages/c.hbs'
      ]);
    });
  });

  describe('rendering views', function () {
    beforeEach(function () {
      app = new App();
      app.engine('tmpl', require('engine-lodash'));
      app.create('pages');
    });

    it('should render a view with inherited app.render', function () {
      app.page('test/fixtures/templates/a.tmpl')
        .use(function (view) {
          if (!view.contents) {
            view.contents = fs.readFileSync(view.path);
          }
        })
        .set('data.name', 'Brian')
        .render(function (err, res) {
          if (err) return done(err);
          assert(res.contents.toString() === 'Brian');
        })
    });
  });
});
