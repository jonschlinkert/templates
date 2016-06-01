'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var assert = require('assert');
var es = require('event-stream');
var Stream = require('stream');

module.exports = function(App, options, runner) {
  var Item = App.Item;
  var item;
  var app;

  describe('Item', function() {
    describe('instance', function() {
      it('should create an instance of Item:', function() {
        item = new Item();
        assert(item instanceof Item);
      });

      it('inspect should not double name `Stream` when ctor is `Stream`', function(cb) {
        var fn = console.log;
        var count = 0;
        console.log = function(val) {
          console.log = fn;
          assert.deepEqual(val.inspect(), '<Item <Stream>>');
          count++;
        };
        var val = new Stream();
        item = new Item({contents: val});
        console.log(item);
        assert.equal(count, 1);
        cb();
      });
    });

    describe('static methods', function() {
      it('should expose `extend`:', function() {
        assert.equal(typeof Item.extend, 'function');
      });
    });

    describe('prototype methods', function() {
      beforeEach(function() {
        item = new Item();
      });

      it('should expose `set`:', function() {
        assert.equal(typeof item.set, 'function');
      });
      it('should expose `get`:', function() {
        assert.equal(typeof item.get, 'function');
      });
      it('should expose `del`:', function() {
        assert.equal(typeof item.del, 'function');
      });
      it('should expose `define`:', function() {
        assert.equal(typeof item.define, 'function');
      });
      it('should expose `visit`:', function() {
        assert.equal(typeof item.visit, 'function');
      });
    });

    describe('properties', function() {
      it('should expose a `_name` property', function() {
        item = new Item({});
        assert(item._name);
      });

      it('should use `Item` as the default `_name`', function() {
        item = new Item({});
        assert.equal(item._name, 'item');
      });

      it('should allow `_name` to be set after instantiation', function() {
        item = new Item({});
        item._name = 'foo';
        assert.equal(item._name, 'foo');
      });

      it('should expose an `options` property', function() {
        item = new Item({});
        assert.deepEqual(item.options, {});
        assert(item.hasOwnProperty('options'));
      });

      it('should add `options` when passed on the constructor', function() {
        item = new Item({options: {foo: 'bar'}});
        assert.equal(item.options.foo, 'bar');
      });

      it('should expose a `data` property', function() {
        item = new Item({app: {}});
        assert.deepEqual(item.data, {});
        assert(item.hasOwnProperty('data'));
      });

      it('should add `data` when passed on the constructor', function() {
        item = new Item({data: {foo: 'bar'}});
        assert.equal(item.data.foo, 'bar');
      });

      it('should add `locals` when passed on the constructor', function() {
        item = new Item({locals: {foo: 'bar'}});
        assert.equal(item.locals.foo, 'bar');
      });
    });

    describe('set', function() {
      it('should set properties on the object', function() {
        item = new Item();
        item.set('foo', 'bar');
        assert.equal(item.foo, 'bar');
      });
    });

    describe('get', function() {
      it('should get properties from the object', function() {
        item = new Item();
        item.set('foo', 'bar');
        assert.equal(item.get('foo'), 'bar');
      });
    });

    describe('cwd', function() {
      it('should get properties from the object', function() {
        item = new Item({cwd: 'test/fixtures'});
        assert.equal(item.cwd, 'test/fixtures');
      });
    });

    describe('clone', function() {
      it('should clone the item:', function() {
        item = new Item({content: 'foo'});
        item.set({path: 'foo/bar'});
        item.set('options.one', 'two');
        var clone = item.clone();
        assert(clone.contents);
        clone.set('baz', 'quux');
        clone.set('options.three', 'four');
        assert.equal(clone.get('foo'), item.get('foo'));
        assert.equal(clone.get('baz'), 'quux');
        assert(!item.get('baz'));
        // not deep cloned
        assert.equal(clone.get('options.three'), 'four');
        assert.equal(item.get('options.three'), 'four');
      });

      it('should deep clone the entire object', function() {
        item = new Item({content: 'foo'});
        item.set({path: 'foo/bar'});
        item.set('options.one', 'two');
        var clone = item.clone({deep: true});
        clone.set('options.three', 'four');
        assert.equal(item.get('options.one'), 'two');
        assert.equal(clone.get('options.one'), 'two');
        assert.equal(clone.get('options.three'), 'four');

        assert.equal(typeof item.get('options.three'), 'undefined');
      });
    });

    describe('visit', function() {
      it('should visit all properties on an object and call the specified method', function() {
        item = new Item();
        var obj = {
          foo: 'bar',
          bar: 'baz',
          baz: 'bang'
        };
        item.visit('set', obj);
        assert.equal(item.get('foo'), 'bar');
        assert.equal(item.get('bar'), 'baz');
        assert.equal(item.get('baz'), 'bang');
      });

      it('should visit all properties on all objects in an array and call the specified method', function() {
        item = new Item();
        var arr = [{foo: 'bar', bar: 'baz', baz: 'bang'}];
        item.visit('set', arr);
        assert.equal(item.get('foo'), 'bar');
        assert.equal(item.get('bar'), 'baz');
        assert.equal(item.get('baz'), 'bang');
      });
    });
  });

  /**
   * The following unit tests are from Vinyl
   * Since we inherit vinyl in Item, we need
   * to ensure that these still pass.
   */

  describe('Item', function() {
    describe('isVinyl()', function() {
      it('should return true on a vinyl object', function(cb) {
        item = new Item();
        assert.equal(Item.isVinyl(item), true);
        cb();
      });
      it('should return false on a normal object', function(cb) {
        assert.equal(Item.isVinyl({}), false);
        cb();
      });
      it('should return false on a null object', function(cb) {
        assert.equal(Item.isVinyl({}), false);
        cb();
      });
    });

    describe('constructor()', function() {
      it('should default cwd to process.cwd', function(cb) {
        item = new Item();
        assert.equal(item.cwd, process.cwd());
        cb();
      });

      it('should default base to cwd', function(cb) {
        var cwd = '/';
        item = new Item({cwd: cwd});
        assert.equal(item.base, cwd);
        cb();
      });

      it('should default base to cwd even when none is given', function(cb) {
        item = new Item();
        assert.equal(item.base, process.cwd());
        cb();
      });

      it('should default path to null', function(cb) {
        item = new Item();
        assert(!item.path);
        cb();
      });

      it('should default history to []', function(cb) {
        item = new Item();
        assert.deepEqual(item.history, []);
        cb();
      });

      it('should default stat to null', function(cb) {
        item = new Item();
        assert(!item.stat);
        cb();
      });

      it('should default contents to null', function(cb) {
        item = new Item();
        assert(!item.contents);
        cb();
      });

      it('should set base to given value', function(cb) {
        var val = '/';
        item = new Item({base: val});
        assert.equal(item.base, val);
        cb();
      });

      it('should set cwd to given value', function(cb) {
        var val = '/';
        item = new Item({cwd: val});
        assert.equal(item.cwd, val);
        cb();
      });

      it('should set path to given value', function(cb) {
        var val = '/test.coffee';
        item = new Item({path: val});
        assert.equal(item.path, val);
        assert.deepEqual(item.history, [val]);
        cb();
      });

      it('should set history to given value', function(cb) {
        var val = '/test.coffee';
        item = new Item({history: [val]});
        assert.equal(item.path, val);
        assert.deepEqual(item.history, [val]);
        cb();
      });

      it('should set stat to given value', function(cb) {
        var val = {};
        item = new Item({stat: val});
        assert.equal(item.stat, val);
        cb();
      });

      it('should set contents to given value', function(cb) {
        var val = new Buffer('test');
        item = new Item({contents: val});
        assert.equal(item.contents, val);
        cb();
      });
    });

    describe('isBuffer()', function() {
      it('should return true when the contents are a Buffer', function(cb) {
        var val = new Buffer('test');
        item = new Item({contents: val});
        assert.equal(item.isBuffer(), true);
        cb();
      });

      it('should return false when the contents are a Stream', function(cb) {
        var val = new Stream();
        var item = new Item({contents: val});
        assert.equal(item.isBuffer(), false);
        cb();
      });

      it('should return false when the contents are a null', function(cb) {
        var item = new Item({contents: null});
        assert.equal(item.isBuffer(), false);
        cb();
      });
    });

    describe('isStream()', function() {
      it('should return false when the contents are a Buffer', function(cb) {
        var val = new Buffer('test');
        var item = new Item({contents: val});
        assert.equal(item.isStream(), false);
        cb();
      });

      it('should return true when the contents are a Stream', function(cb) {
        var val = new Stream();
        var item = new Item({contents: val});
        assert.equal(item.isStream(), true);
        cb();
      });

      it('should return false when the contents are a null', function(cb) {
        var item = new Item({contents: null});
        assert.equal(item.isStream(), false);
        cb();
      });
    });

    describe('isNull()', function() {
      it('should return false when the contents are a Buffer', function(cb) {
        var val = new Buffer('test');
        var item = new Item({contents: val});
        assert.equal(item.isNull(), false);
        cb();
      });

      it('should return false when the contents are a Stream', function(cb) {
        var val = new Stream();
        var item = new Item({contents: val});
        assert.equal(item.isNull(), false);
        cb();
      });

      it('should return true when the contents are a null', function(cb) {
        var item = new Item({contents: null});
        assert.equal(item.isNull(), true);
        cb();
      });
    });

    describe('isDirectory()', function() {
      var fakeStat = {
        isDirectory: function() {
          return true;
        }
      };

      it('should return false when the contents are a Buffer', function(cb) {
        var val = new Buffer('test');
        var item = new Item({contents: val, stat: fakeStat});
        assert.equal(item.isDirectory(), false);
        cb();
      });

      it('should return false when the contents are a Stream', function(cb) {
        var val = new Stream();
        var item = new Item({contents: val, stat: fakeStat});
        assert.equal(item.isDirectory(), false);
        cb();
      });

      it('should return true when the contents are a null', function(cb) {
        var item = new Item({contents: null, stat: fakeStat});
        assert.equal(item.isDirectory(), true);
        cb();
      });
    });

    describe('clone()', function() {
      it('should copy all attributes over with Buffer', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: new Buffer('test')
        };
        var item = new Item(options);
        var item2 = item.clone();

        assert.notEqual(item2, item, 'refs should be different');
        assert.equal(item2.cwd, item.cwd);
        assert.equal(item2.base, item.base);
        assert.equal(item2.path, item.path);
        assert.notEqual(item2.contents, item.contents, 'buffer ref should be different');
        assert.equal(item2.contents.toString('utf8'), item.contents.toString('utf8'));
        cb();
      });

      it('should copy buffer\'s reference with option contents: false', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.js',
          contents: new Buffer('test')
        };

        var item = new Item(options);

        var copy1 = item.clone({ contents: false });
        assert.equal(copy1.contents, item.contents);

        var copy2 = item.clone({});
        assert.notEqual(copy2.contents, item.contents);

        var copy3 = item.clone({ contents: 'any string' });
        assert.notEqual(copy3.contents, item.contents);

        cb();
      });

      it('should copy all attributes over with Stream', function(cb) {
        var contents = new Stream.PassThrough();

        var item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: contents
        });

        var item2 = item.clone();
        contents.write(new Buffer('wa'));

        process.nextTick(function() {
          contents.write(new Buffer('dup'));
          contents.end();
        });

        assert.notEqual(item2, item, 'refs should be different');
        assert.equal(item2.cwd, item.cwd);
        assert.equal(item2.base, item.base);
        assert.equal(item2.path, item.path);
        assert.notEqual(item2.contents, item.contents, 'stream ref should not be the same');
        item.contents.pipe(es.wait(function(err, data) {
          if (err) return cb(err);
          item2.contents.pipe(es.wait(function(err, data2) {
            if (err) return cb(err);
            assert.notEqual(data2, data, 'stream contents ref should not be the same');
            assert.deepEqual(data2, data, 'stream contents should be the same');
          }));
        }));
        cb();
      });

      it('should copy all attributes over with null', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: null
        };
        var item = new Item(options);
        var item2 = item.clone();

        assert.notEqual(item2, item, 'refs should be different');
        assert.equal(item2.cwd, item.cwd);
        assert.equal(item2.base, item.base);
        assert.equal(item2.path, item.path);
        assert(!item2.contents);
        cb();
      });

      it('should properly clone the `stat` property', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.js',
          contents: new Buffer('test'),
          stat: fs.statSync(__filename)
        };

        var item = new Item(options);
        var copy = item.clone();

        assert(copy.stat.isFile());
        assert(!copy.stat.isDirectory());
        cb();
      });

      it('should properly clone the `history` property', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.js',
          contents: new Buffer('test'),
          stat: fs.statSync(__filename)
        };

        var item = new Item(options);
        var copy = item.clone();

        assert.equal(copy.history[0], options.path);
        copy.path = 'lol';
        assert.notEqual(item.path, copy.path);
        cb();
      });

      it('should copy custom properties', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: null
        };

        var item = new Item(options);
        item.custom = { a: 'custom property' };
        var item2 = item.clone();

        assert.notEqual(item2, item, 'refs should be different');
        assert.equal(item2.cwd, item.cwd);
        assert.equal(item2.base, item.base);
        assert.equal(item2.path, item.path);
        assert.equal(item2.custom, item.custom);
        assert.equal(item2.custom.a, item.custom.a);

        cb();
      });

      it('should copy history', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: null
        };

        var item = new Item(options);
        item.path = '/test/test.js';
        item.path = '/test/test-938di2s.js';
        var item2 = item.clone();

        assert.deepEqual(item2.history, [
          '/test/test.coffee',
          '/test/test.js',
          '/test/test-938di2s.js'
        ]);
        assert.notEqual(item2.history, [
          '/test/test.coffee',
          '/test/test.js',
          '/test/test-938di2s.js'
        ]);
        assert.deepEqual(item2.path, '/test/test-938di2s.js');

        cb();
      });

      it('should copy all attributes deeply', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: null
        };

        var item = new Item(options);
        item.custom = { a: 'custom property' };

        var item2 = item.clone(true);
        assert.deepEqual(item2.custom, item.custom);
        assert.notEqual(item2.custom, item.custom);
        assert.equal(item2.custom.a, item.custom.a);

        var item3 = item.clone({ deep: true });
        assert.deepEqual(item3.custom, item.custom);
        assert.notEqual(item3.custom, item.custom);
        assert.equal(item3.custom.a, item.custom.a);

        var item4 = item.clone(false);
        assert.deepEqual(item4.custom, item.custom);
        assert.equal(item4.custom, item.custom);
        assert.equal(item4.custom.a, item.custom.a);

        var item5 = item.clone({ deep: false });
        assert.deepEqual(item5.custom, item.custom);
        assert.equal(item5.custom, item.custom);
        assert.equal(item5.custom.a, item.custom.a);

        cb();
      });
    });

    describe('pipe()', function() {
      it('should write to stream with Buffer', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: new Buffer('test')
        };
        var item = new Item(options);
        var stream = new Stream.PassThrough();
        stream.on('data', function(chunk) {
          assert(chunk);
          assert.equal((chunk instanceof Buffer), true, 'should write as a buffer');
          assert.equal(chunk.toString('utf8'), options.contents.toString('utf8'));
        });
        stream.on('end', function() {
          cb();
        });
        var ret = item.pipe(stream);
        assert.equal(ret, stream, 'should return the stream');
      });

      it('should pipe to stream with Stream', function(cb) {
        var testChunk = new Buffer('test');
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: new Stream.PassThrough()
        };
        var item = new Item(options);
        var stream = new Stream.PassThrough();
        stream.on('data', function(chunk) {
          assert(chunk);
          assert.equal((chunk instanceof Buffer), true, 'should write as a buffer');
          assert.equal(chunk.toString('utf8'), testChunk.toString('utf8'));
          cb();
        });
        var ret = item.pipe(stream);
        assert.equal(ret, stream, 'should return the stream');

        item.contents.write(testChunk);
      });

      it('should do nothing with null', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: null
        };
        var item = new Item(options);
        var stream = new Stream.PassThrough();
        stream.on('data', function() {
          throw new Error('should not write');
        });
        stream.on('end', function() {
          cb();
        });
        var ret = item.pipe(stream);
        assert.equal(ret, stream, 'should return the stream');
      });

      it('should write to stream with Buffer', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: new Buffer('test')
        };
        var item = new Item(options);
        var stream = new Stream.PassThrough();
        stream.on('data', function(chunk) {
          assert(chunk);
          assert.equal((chunk instanceof Buffer), true, 'should write as a buffer');
          assert.equal(chunk.toString('utf8'), options.contents.toString('utf8'));
          cb();
        });
        stream.on('end', function() {
          throw new Error('should not end');
        });
        var ret = item.pipe(stream, {end: false});
        assert.equal(ret, stream, 'should return the stream');
      });

      it('should pipe to stream with Stream', function(cb) {
        var testChunk = new Buffer('test');
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: new Stream.PassThrough()
        };
        var item = new Item(options);
        var stream = new Stream.PassThrough();
        stream.on('data', function(chunk) {
          assert(chunk);
          assert.equal((chunk instanceof Buffer), true, 'should write as a buffer');
          assert.equal(chunk.toString('utf8'), testChunk.toString('utf8'));
          cb();
        });
        stream.on('end', function() {
          throw new Error('should not end');
        });
        var ret = item.pipe(stream, {end: false});
        assert.equal(ret, stream, 'should return the stream');

        item.contents.write(testChunk);
      });

      it('should do nothing with null', function(cb) {
        var options = {
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: null
        };
        var item = new Item(options);
        var stream = new Stream.PassThrough();
        stream.on('data', function() {
          throw new Error('should not write');
        });
        stream.on('end', function() {
          throw new Error('should not end');
        });
        var ret = item.pipe(stream, {end: false});
        assert.equal(ret, stream, 'should return the stream');
        process.nextTick(cb);
      });
    });

    describe('inspect()', function() {
      it('should return correct format when no contents and no path', function(cb) {
        var item = new Item();
        assert.equal(item.inspect(), '<Item >');
        cb();
      });

      it('should update the name when `_name` is defined', function(cb) {
        var item = new Item();
        item._name = 'Foo';
        assert.equal(item.inspect(), '<Foo >');
        cb();
      });

      it('should not add duplicate `Stream` name to inspect name', function(cb) {
        function PassThroughStream() {
          Stream.PassThrough.apply(this, arguments);
        }
        util.inherits(PassThroughStream, Stream.PassThrough);
        var contents = new PassThroughStream();

        var item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: contents
        });

        contents.write(new Buffer('foo'));
        assert.equal(item.inspect(), '<Item "test.coffee" <PassThroughStream>>');
        cb();
      });

      it('should return correct format when Buffer and no path', function(cb) {
        var val = new Buffer('test');
        var item = new Item({
          contents: val
        });
        assert.equal(item.inspect(), '<Item <Buffer 74 65 73 74>>');
        cb();
      });

      it('should return correct format when Buffer and relative path', function(cb) {
        var val = new Buffer('test');
        var item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: val
        });
        assert.equal(item.inspect(), '<Item "test.coffee" <Buffer 74 65 73 74>>');
        cb();
      });

      it('should return correct format when Buffer and only path and no base', function(cb) {
        var val = new Buffer('test');
        var item = new Item({
          cwd: '/',
          path: '/test/test.coffee',
          contents: val
        });
        delete item.base;
        assert.equal(item.inspect(), '<Item "/test/test.coffee" <Buffer 74 65 73 74>>');
        cb();
      });

      it('should return correct format when Stream and relative path', function(cb) {
        var item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: new Stream.PassThrough()
        });
        assert.equal(item.inspect(), '<Item "test.coffee" <PassThroughStream>>');
        cb();
      });

      it('should return correct format when null and relative path', function(cb) {
        var item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee',
          contents: null
        });
        assert.equal(item.inspect(), '<Item "test.coffee">');
        cb();
      });
    });

    describe('contents get/set', function() {
      it('should work with Buffer', function(cb) {
        var val = new Buffer('test');
        var item = new Item();
        item.contents = val;
        assert.equal(item.contents, val);
        cb();
      });

      it('should work with Stream', function(cb) {
        var val = new Stream.PassThrough();
        var item = new Item();
        item.contents = val;
        assert.equal(item.contents, val);
        cb();
      });

      it('should work with null', function(cb) {
        var val = null;
        var item = new Item();
        item.contents = val;
        assert.equal(item.contents, null);
        cb();
      });

      it('should work with string', function(cb) {
        var val = 'test';
        var item = new Item();
        item.contents = val;
        assert.deepEqual(item.contents, new Buffer(val));
        cb();
      });
    });

    describe('relative get/set', function() {
      it('should error on set', function(cb) {
        var item = new Item();
        try {
          item.relative = 'test';
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should error on get when no base', function(cb) {
        var item = new Item();
        delete item.base;
        try {
          item.relative;
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should error on get when no path', function(cb) {
        var item = new Item();
        try {
          item.relative;
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should return a relative path from base', function(cb) {
        var item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        assert.equal(item.relative, 'test.coffee');
        cb();
      });

      it('should return a relative path from cwd', function(cb) {
        var item = new Item({
          cwd: '/',
          path: '/test/test.coffee'
        });
        assert.equal(item.relative, path.join('test', 'test.coffee'));
        cb();
      });
    });

    describe('dirname get/set', function() {
      it('should error on get when no path', function(cb) {
        var item = new Item();
        try {
          item.dirname;
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should return the dirname of the path', function(cb) {
        var item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        assert.equal(item.dirname, '/test');
        cb();
      });

      it('should error on set when no path', function(cb) {
        var item = new Item();
        try {
          item.dirname = '/test';
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should set the dirname of the path', function(cb) {
        var item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        item.dirname = '/test/foo';
        assert.equal(item.path, '/test/foo/test.coffee');
        cb();
      });
    });

    describe('stem', function() {
      it('should error on get when no path', function(cb) {
        item = new Item();
        try {
          item.stem;
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should set the stem of the path', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        item.stem = 'foo';
        assert.equal(item.path, '/test/foo.coffee');
        cb();
      });

      it('should get the stem of the path', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        assert.equal(item.stem, 'test');
        cb();
      });

      it('should error on set when no path', function(cb) {
        item = new Item();
        try {
          item.stem = 'test.coffee';
        } catch (err) {
          assert(err);
          cb();
        }
      });
    });

    describe('filename', function() {
      it('should error on get when no path', function(cb) {
        item = new Item();
        try {
          item.filename;
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should set the filename of the path', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        item.filename = 'foo';
        assert.equal(item.path, '/test/foo.coffee');
        cb();
      });

      it('should get the filename of the path', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        assert.equal(item.filename, 'test');
        cb();
      });

      it('should stay synchronized with stem', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        assert.equal(item.filename, item.stem);
        item.stem = 'foo';
        assert.equal(item.filename, 'foo');
        item.filename = 'bar';
        assert.equal(item.stem, 'bar');
        cb();
      });

      it('should error on set when no path', function(cb) {
        item = new Item();
        try {
          item.filename = 'test.coffee';
        } catch (err) {
          assert(err);
          cb();
        }
      });
    });

    describe('basename', function() {
      it('should error on get when no path', function(cb) {
        item = new Item();
        try {
          item.basename;
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should set the basename of the path', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        item.basename = 'foo.png';
        assert.equal(item.path, '/test/foo.png');
        cb();
      });

      it('should get the basename of the path', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        assert.equal(item.basename, 'test.coffee');
        cb();
      });

      it('should error on set when no path', function(cb) {
        item = new Item();
        try {
          item.basename = 'test.coffee';
        } catch (err) {
          assert(err);
          cb();
        }
      });
    });

    describe('extname', function() {
      it('should error on get when no path', function(cb) {
        item = new Item();
        try {
          item.extname;
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should return the extname of the path', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        assert.equal(item.extname, '.coffee');
        cb();
      });

      it('should error on set when no path', function(cb) {
        item = new Item();
        try {
          item.extname = '.coffee';
        } catch (err) {
          assert(err);
          cb();
        }
      });

      it('should set the extname of the path', function(cb) {
        item = new Item({
          cwd: '/',
          base: '/test/',
          path: '/test/test.coffee'
        });
        item.extname = '.png';
        assert.equal(item.path, '/test/test.png');
        cb();
      });
    });

    describe('path get/set', function() {

      it('should record history when instantiation', function() {
        var item = new Item({
          cwd: '/',
          path: '/test/test.coffee'
        });

        assert.deepEqual(item.path, '/test/test.coffee');
        assert.deepEqual(item.history, ['/test/test.coffee']);
      });

      it('should record history when path change', function() {
        var item = new Item({
          cwd: '/',
          path: '/test/test.coffee'
        });

        item.path = '/test/test.js';
        assert.deepEqual(item.path, '/test/test.js');
        assert.deepEqual(item.history, ['/test/test.coffee', '/test/test.js']);

        item.path = '/test/test.coffee';
        assert.deepEqual(item.path, '/test/test.coffee');
        assert.deepEqual(item.history, ['/test/test.coffee', '/test/test.js', '/test/test.coffee']);
      });

      it('should not record history when set the same path', function() {
        var item = new Item({
          cwd: '/',
          path: '/test/test.coffee'
        });

        item.path = '/test/test.coffee';
        item.path = '/test/test.coffee';
        assert.deepEqual(item.path, '/test/test.coffee');
        assert.deepEqual(item.history, ['/test/test.coffee']);

        // ignore when set empty string
        item.path = '';
        assert.deepEqual(item.path, '/test/test.coffee');
        assert.deepEqual(item.history, ['/test/test.coffee']);
      });

      it('should throw when set path null in constructor', function(cb) {
        try {
          item = new Item({
            cwd: '/',
            path: null
          });
          
          cb(new Error('expected an error'));
        } catch (err) {
          assert.equal(err.message, 'path should be string');
          cb();
        }
      });

      it('should throw when set path null', function(cb) {
        try {
          item = new Item({
            cwd: '/',
            path: 'foo'
          });
          item.path = null;
          
          cb(new Error('expected an error'));
        } catch (err) {
          assert.equal(err.message, 'path should be string');
          cb();
        }
      });
    });
  });
};
