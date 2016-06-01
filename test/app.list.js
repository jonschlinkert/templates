'use strict';

var fs = require('fs');
var assert = require('assert');
var path = require('path');
var fixtures = path.resolve.bind(path, __dirname, 'fixtures');

module.exports = function(App, options, runner) {
  var List = App.List;
  var app;

  describe('app.list', function() {
    describe('method', function() {
      beforeEach(function() {
        app = new App();
      });

      it('should expose the list method', function() {
        assert.equal(typeof app.list, 'function');
      });

      it('should have isList property', function() {
        var list = app.list();
        assert(list.isList);
      });
    });

    describe('adding items', function() {
      beforeEach(function() {
        app = new App();
        app.engine('tmpl', require('engine-base'));
        app.create('pages');
      });

      it('should add an item to a list:', function() {
        app.pages(fixtures('pages/a.hbs'));
        var list = app.list();
        list.addItem(app.pages.getView(fixtures('pages/a.hbs')));
        assert(list.hasItem(fixtures('pages/a.hbs')));
      });

      it('should expose the `option` method from a list:', function() {
        var list = app.list();
        list.option('a', 'b');
        assert(list.options);
        assert.equal(list.options.a, 'b');
      });
    });

    describe('addItem', function() {
      beforeEach(function() {
        app = new App();
      });

      it('should add items to a list', function() {
        var pages = app.list({List: List});
        pages.addItem('foo');
        pages.addItem('bar');
        pages.addItem('baz');

        pages.items.hasOwnProperty('foo');
        pages.items.hasOwnProperty('bar');
        pages.items.hasOwnProperty('baz');
      });

      it('should create a list from an existing list:', function() {
        var pages = app.list({List: List});
        pages.addItem('foo');
        pages.addItem('bar');
        pages.addItem('baz');

        var posts = app.list(pages);
        posts.items.hasOwnProperty('foo');
        posts.items.hasOwnProperty('bar');
        posts.items.hasOwnProperty('baz');
      });
    });

    describe('rendering items', function() {
      beforeEach(function() {
        app = new App();
        app.engine('tmpl', require('engine-base'));
        app.create('pages');
      });

      it('should render a item with inherited app.render', function(cb) {
        app.page(fixtures('templates/a.tmpl'))
          .use(function(item) {
            if (!item.content) {
              item.contents = fs.readFileSync(item.path);
            }
          })
          .set('data.name', 'Brian')
          .render(function(err, res) {
            if (err) return cb(err);
            assert.equal(res.contents.toString(), 'Brian');
            cb();
          });
      });
    });
  });
};
