require('mocha');
require('should');
var assert = require('assert');
var App = require('..');
var app;

describe('partials', function () {
  beforeEach(function () {
    app = new App();
    app.engine('tmpl', require('engine-base'));
    app.engine('hbs', require('engine-handlebars'));

    app.create('partials', { viewType: 'partial' });
    app.create('include', { viewType: 'partial' });
    app.create('layouts', { viewType: 'layout' });
    app.create('page');
  });

  it('should inject a partial with a helper:', function (done) {
    app.include('base', {path: 'base.tmpl', content: 'xyz'});
    app.pages('a.tmpl', {path: 'a.tmpl', content: 'a <%= include("base") %> c'});
    var page = app.pages.getView('a.tmpl');

    app.render(page, function (err, view) {
      if (err) return done(err);
      assert.equal(typeof view.content, 'string');
      assert.equal(view.content, 'a xyz c');
      done();
    });
  });

  it('should use layouts with partials:', function (done) {
    app.layout('default', {path: 'a.tmpl', content: 'a {% body %} c'});
    app.include('b', {path: 'b.tmpl', content: 'b', layout: 'default'});
    app.pages('a.tmpl', {path: 'c.tmpl', content: '<%= include("b") %>'});
    var page = app.pages.getView('a.tmpl');

    app.render(page, function (err, view) {
      if (err) return done(err);
      assert.equal(typeof view.content, 'string');
      assert.equal(view.content, 'a b c');
      done();
    });
  });

  it('should add `layoutApplied` after layout is applied:', function (done) {
    app.layout('default', {path: 'a.tmpl', content: 'a {% body %} c'});
    app.include('b', {path: 'b.tmpl', content: 'b', layout: 'default'});
    app.pages('a.tmpl', {path: 'c.tmpl', content: '<%= include("b") %>'});
    var page = app.pages.getView('a.tmpl');

    app.render(page, function (err, view) {
      if (err) return done(err);
      assert.equal(typeof view.content, 'string');
      assert.equal(app.layouts.getView('default').options.layoutApplied);
      assert.equal(view.content, 'a b c');
      done();
    });
  });

  it('should pass partials to handlebars:', function (done) {
    app.layout('default', {path: 'a.hbs', content: 'a {% body %} c'});
    app.include('foo', {path: 'foo.hbs', content: 'foo', layout: 'default'});
    app.pages('a.hbs', {path: 'c.hbs', content: '{{> foo }}'});
    var page = app.pages.getView('a.hbs');

    app.render(page, function (err, view) {
      if (err) return done(err);
      assert.equal(typeof view.content, 'string');
      assert.equal(view.content, 'a foo c');
      done();
    });
  });

  it('should only merge in the specified viewTypes:', function (done) {
    app.layout('default', {path: 'a.hbs', content: 'a {% body %} c'});
    app.option('mergeTypes', ['includes']);

    app.partial('foo', {path: 'bar.hbs', content: 'bar', layout: 'default'});
    app.include('foo', {path: 'foo.hbs', content: 'foo', layout: 'default'});

    app.pages('a.hbs', {path: 'c.hbs', content: '{{> foo }}'});
    app.pages.getView('a.hbs')
      .render(function (err, view) {
        if (err) return done(err);
        assert.equal(typeof view.content, 'string');
        assert.equal(view.content, 'a foo c');
        done();
      });

  });

  it('should merge the specified viewTypes in the order defined:', function (done) {
    app.layout('default', {path: 'a.hbs', content: 'a {% body %} c'});
    app.option('mergeTypes', ['partials', 'includes']);

    app.partial('foo', {path: 'bar.hbs', content: 'bar', layout: 'default'});
    app.include('foo', {path: 'foo.hbs', content: 'foo', layout: 'default'});

    app.pages('a.hbs', {path: 'c.hbs', content: '{{> foo }}'});
    app.pages.getView('a.hbs')
      .render(function (err, view) {
        if (err) return done(err);
        assert.equal(typeof view.content, 'string');
        assert.equal(view.content, 'a foo c');
        done();
      });

  });
});
