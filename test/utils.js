require('mocha');
require('should');
var path = require('path');
var assert = require('assert');
var isAbsolute = require('is-absolute');
var utils = require('../lib/utils');

describe('utils', function () {
  describe('bindAll', function() {
    it('should bind a context to fns passed on an object:', function () {
      var ctx = {app: {views: {}}, context: {a: 'b'}};
      var helpers = utils.bindAll({
        foo: function() {
          return this.context;
        },
        bar: function() {},
        baz: function() {}
      }, ctx);

      assert.deepEqual(helpers.foo(), {a: 'b'});
    });

    it('should bind a context to fns passed on an object of objects:', function () {
      var ctx = {app: {views: {}}, context: {a: 'b'}};
      var helpers = utils.bindAll({
        whatever: {
          foo: function() {
            return this.context;
          },
          bar: function() {},
          baz: function() {}
        }
      }, ctx);

      assert.deepEqual(helpers.whatever.foo(), {a: 'b'});
    });

    it('should bind a context to fns passed on an object of objects:', function () {
      var ctx = {app: {views: {}}, context: {a: 'b'}};
      var obj = {
        whatever: {
          foo: function() {
            return this.context;
          },
          bar: function() {},
          baz: function() {}
        }
      };
      obj.whatever.foo.async = true;
      var helpers = utils.bindAll(obj, ctx);
      assert(helpers.whatever.foo.async === true);
    });
  });

  describe('error', function() {
    it('should format an error message:', function () {
      var err = utils.error('foo: ', {a: 'b'});
      assert(err.message === 'foo: {"a":"b"}');
    });
  });

  describe('formatExt', function() {
    it('should ensure that file extension is preceded by a dot:', function () {
      assert(utils.formatExt('.js') === '.js');
      assert(utils.formatExt('js') === '.js');
    });

    it('should throw an error when not a string:', function () {
      (function () {
        utils.formatExt();
      }).should.throw('utils.formatExt() expects `ext` to be a string.');
    });
  });

  describe('getLocals', function() {
    it('should get locals from an object:', function () {
      var a = {foo: 'bar', hash: {one: 'two'}};
      var b = {baz: 'qux', hash: {three: 'four'}};

      assert.deepEqual(utils.getLocals(a, b), {
        three: 'four',
        one: 'two',
        baz: 'qux',
        foo: 'bar'
      });
    });
  });

  describe('has', function() {
    it('should return true if an array has the given element:', function () {
      assert(utils.has(['a', 'b', 'c'], 'c'));
      assert(!utils.has(['a', 'b', 'c'], 'd'));
    });

    it('should return true if an object has the given key:', function () {
      assert(utils.has({a: 'b', c: 'd'}, 'a'));
      assert(!utils.has({a: 'b', c: 'd'}, 'd'));
    });
  });

  describe('hasAny', function() {
    it('should return true if an array has any of the given elements:', function () {
      assert(utils.hasAny(['a', 'b', 'c'], ['c', 'f']));
      assert(!utils.hasAny(['a', 'b', 'c'], ['d', 'f']));
    });

    it('should return true if an object has any of the given keys:', function () {
      assert(utils.hasAny({a: 'b', c: 'd'}, ['a', 'b']));
      assert(!utils.hasAny({a: 'b', c: 'd'}, ['d', 'e']));
    });
  });

  describe('isView', function() {
    it('should return true if a value looks like a view:', function () {
      assert(utils.isView({a: 'b', c: 'd', contents: '...'}));
      assert(utils.isView({a: 'b', c: 'd', content: '...'}));
      assert(utils.isView({a: 'b', c: 'd', path: '...'}));
      assert(!utils.isView({a: 'b', c: 'd'}));
    });
  });

  describe('requireGlob', function() {
    it('should return an empty object for non-requireable files:', function () {
      var files = utils.requireGlob('test/fixtures/**/*.txt');
      assert.deepEqual(files, {});
    });

    it('should return an object for a glob of files:', function () {
      var files = utils.requireGlob('test/fixtures/**/*.js');
      assert(files && typeof files === 'object');
      var keys = Object.keys(files);
      assert(keys.length > 0);
      keys.forEach(function (key) {
        var val = files[key];
        assert(typeof val === 'function' || typeof val === 'object');
      });
    });

    it('should use a custom rename key function:', function () {
      var files = utils.requireGlob('test/fixtures/**/*.js', {
        rename: function (key) {
          return 'foo_' + path.basename(key, path.extname(key));
        }
      });
      assert(files && typeof files === 'object');
      assert(files.hasOwnProperty('foo_a'));
      assert(files.hasOwnProperty('foo_b'));
      assert(files.hasOwnProperty('foo_c'));
      var keys = Object.keys(files);
      assert(keys.length > 0);
      keys.forEach(function (key) {
        var val = files[key];
        assert(typeof val === 'function' || typeof val === 'object');
      });
    });
  });

  describe('resolveGlob', function() {
    it('should resolve absolute paths for a glob of files:', function () {
      var files = utils.resolveGlob('test/fixtures/**/*.js');
      assert(files.length > 0);
      files.forEach(function (fp) {
        assert(isAbsolute(fp));
      });
    });
  });


  describe('stripDot', function() {
    it('should strip the dot preceding a file extension:', function () {
      assert(utils.stripDot('.js') === 'js');
      assert(utils.stripDot('js') === 'js');
    });

    it('should throw an error when not a string:', function () {
      (function () {
        utils.stripDot();
      }).should.throw('utils.stripDot() expects `ext` to be a string.');
    });
  });


  describe('tryRequire', function() {
    it('should require a file:', function () {
      var file = utils.tryRequire('test/fixtures/helpers/a.js');
      assert(typeof file === 'function');
    });

    it('should return `null` when unsuccessful:', function () {
      var file = utils.tryRequire('test/fixtures/helpers/fofofo.js');
      assert(file === null);
    });
  });
});

