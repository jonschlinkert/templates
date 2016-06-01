'use strict';

var assert = require('assert');
var support = require('./support');
var hasProperties = support.hasProperties;

module.exports = function(App, options, runner) {
  var app;

  describe('app.mergePartials', function() {
    beforeEach(function() {
      app = new App();
    });

    it('should merge multiple partials collections onto one collection:', function() {
      var opts = { viewType: 'partial' };
      app.create('foo', opts);
      app.create('bar', opts);
      app.create('baz', opts);

      app.foo('a', {path: 'a', content: 'aaa'});
      app.bar('b', {path: 'b', content: 'bbb'});
      app.baz('c', {path: 'c', content: 'ccc'});

      var actual = app.mergePartials();
      assert(actual.hasOwnProperty('partials'));
      hasProperties(actual.partials, ['a', 'b', 'c']);
    });

    it('should keep partials collections on separate collections:', function() {
      var opts = { viewType: 'partial' };
      app.create('foo', opts);
      app.create('bar', opts);
      app.create('baz', opts);

      app.foo('a', {path: 'a', content: 'aaa'});
      app.bar('b', {path: 'b', content: 'bbb'});
      app.baz('c', {path: 'c', content: 'ccc'});

      var actual = app.mergePartials({mergePartials: false});
      assert(!actual.hasOwnProperty('partials'));
      assert.deepEqual(actual, { foos: { a: 'aaa' }, bars: { b: 'bbb' }, bazs: { c: 'ccc' } });
    });

    it('should emit `mergePartials`:', function() {
      var opts = { viewType: 'partial' };
      app.create('foo', opts);
      app.create('bar', opts);
      app.create('baz', opts);
      var arr = [];

      app.on('onMerge', function(view) {
        arr.push(view.content);
      });

      app.foo('a', {path: 'a', content: 'aaa'});
      app.bar('b', {path: 'b', content: 'bbb'});
      app.baz('c', {path: 'c', content: 'ccc'});

      var actual = app.mergePartials({mergePartials: false});
      assert(!actual.hasOwnProperty('partials'));
      assert.deepEqual(actual, { foos: { a: 'aaa' }, bars: { b: 'bbb' }, bazs: { c: 'ccc' } });
      assert.deepEqual(arr, ['aaa', 'bbb', 'ccc']);
    });

    it('should handle `onMerge` middleware:', function() {
      var opts = { viewType: 'partial' };
      app.create('foo', opts);
      app.create('bar', opts);
      app.create('baz', opts);

      app.onMerge(/./, function(view, next) {
        view.content += ' onMerge';
        next();
      });

      app.foo('a', {path: 'a', content: 'aaa'});
      app.bar('b', {path: 'b', content: 'bbb'});
      app.baz('c', {path: 'c', content: 'ccc'});

      var actual = app.mergePartials({mergePartials: false});
      assert.deepEqual(actual, {
        foos: {a: 'aaa onMerge'},
        bars: {b: 'bbb onMerge'},
        bazs: {c: 'ccc onMerge'}
      });
    });

    it('should skip views with `nomerge=true`:', function() {
      var opts = { viewType: 'partial' };

      app.create('foo', opts);
      app.create('bar', opts);
      app.create('baz', opts);

      app.onMerge(/[ab]/, function(view, next) {
        view.options.nomerge = true;
        next();
      });

      app.foo('a', {path: 'a', content: 'aaa'});
      app.bar('b', {path: 'b', content: 'bbb'});
      app.baz('c', {path: 'c', content: 'ccc'});

      var actual = app.mergePartials({mergePartials: false});
      assert.deepEqual(actual, { bazs: { c: 'ccc' } });
    });
  });

};
