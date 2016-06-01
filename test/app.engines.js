'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('app.engines', function() {
    beforeEach(function() {
      app = new App();
    });

    it('should throw an error when engine name is invalid:', function(cb) {
      try {
        app.engine(null, {});
        cb(new Error('expected an error'));
      } catch (err) {
        assert.equal(err.message, 'expected engine ext to be a string or array.');
        cb();
      }
    });

    it('should register an engine to the given extension', function() {
      app.engine('hbs', function() {});
      assert.equal(typeof app.engines['.hbs'], 'object');
    });

    it('should set an engine with the given extension', function() {
      var hbs = function() {};
      hbs.render = function() {};
      hbs.renderFile = function() {};
      app.engine('hbs', hbs);
      assert(app.engines['.hbs']);
      assert(app.engines['.hbs'].renderFile);
      assert(app.engines['.hbs'].render);
    });

    it('should get an engine:', function() {
      app.engine('hbs', function() {});
      var hbs = app.engine('hbs');
      assert.equal(typeof hbs, 'object');
      assert(hbs.hasOwnProperty('render'));
      assert(hbs.hasOwnProperty('compile'));
    });

    it('should return undefined if no engine is found:', function() {
      var hbs = app.getEngine();
      assert.equal(typeof hbs, 'undefined');
    });

    it('should register an engine with multiple extensions', function() {
      app.engine(['hbs', 'md'], function() {});
      assert(app.engines.hasOwnProperty('.hbs'));
      assert(app.engines.hasOwnProperty('.md'));
    });
  });

  describe('engines', function() {
    beforeEach(function() {
      app = new App();
      app.create('pages');
      app.pages('foo.tmpl', {content: 'A <%= letter %> {{= letter }} C'});
      app.pages('bar.tmpl', {content: 'A <%= letter %> {{ letter }} C'});
    });

    it('should register an engine:', function() {
      app.engine('a', {render: function() {}});
      assert(app.engines.hasOwnProperty('.a'));
    });

    it('should use custom delimiters:', function(cb) {
      app.engine('tmpl', require('engine-base'), {
        delims: ['{{', '}}']
      });
      app.render('foo.tmpl', {letter: 'B'}, function(err, res) {
        if (err) return cb(err);
        assert.equal(res.contents.toString(), 'A <%= letter %> B C');
        cb();
      });
    });

    it('should override individual delims values:', function(cb) {
      app.engine('tmpl', require('engine-base'), {
        interpolate: /\{{([^}]+)}}/g,
        evaluate: /\{{([^}]+)}}/g,
        escape: /\{{-([^}]+)}}/g
      });
      app.render('bar.tmpl', {letter: 'B'}, function(err, res) {
        if (err) return cb(err);
        assert.equal(res.contents.toString(), 'A <%= letter %> B C');
        cb();
      });
    });

    it('should get an engine:', function() {
      app.engine('a', {
        render: function() {}
      });
      var a = app.engine('a');
      assert(a.hasOwnProperty('render'));
    });
  });

  describe('engine selection:', function() {
    beforeEach(function(cb) {
      app = new App();
      app.engine('tmpl', require('engine-base'));
      app.engine('hbs', require('engine-handlebars'));
      app.create('pages');
      cb();
    });

    it('should get the engine from file extension:', function(cb) {
      app.page('a.tmpl', {content: '<%= a %>', locals: {a: 'b'}})
        .render(function(err, view) {
          if (err) return cb(err);
          assert.equal(view.content, 'b');
          cb();
        });
    });

    it('should use the engine defined on the collection:', function(cb) {
      app.create('posts', {engine: 'hbs'});

      app.post('a', {content: '{{a}}', locals: {a: 'b'}})
        .render(function(err, view) {
          if (err) return cb(err);
          assert.equal(view.content, 'b');
          cb();
        });
    });

    it('should use the engine defined on the view:', function(cb) {
      app.create('posts');
      app.post('a', {content: '{{a}}', engine: 'hbs', locals: {a: 'b'}})
        .render(function(err, view) {
          if (err) return cb(err);
          assert.equal(view.content, 'b');
          cb();
        });
    });

    it('should use the engine defined on `view.data`:', function(cb) {
      app.create('posts');
      app.post('a', {content: '{{a}}', locals: {a: 'b'}, data: {engine: 'hbs'}})
        .render(function(err, view) {
          if (err) return cb(err);
          assert.equal(view.content, 'b');
          cb();
        });
    });

    it('should use the engine defined on render locals:', function(cb) {
      app.create('posts');
      app.post('a', {content: '{{a}}', locals: {a: 'b'}})
        .render({engine: 'hbs'}, function(err, view) {
          if (err) return cb(err);
          assert.equal(view.content, 'b');
          cb();
        });
    });
  });
};
