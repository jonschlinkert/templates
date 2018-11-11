'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');
const Stream = require('stream');
const File = require('../lib/file');
const fixture = name => path.join(__dirname, 'fixtures', name);
let file;

describe('File', () => {
  describe('properties', () => {
    it('should add `options` when passed on the constructor', () => {
      file = new File({ options: { foo: 'bar' } });
      assert.equal(file.options.foo, 'bar');
    });

    it('should expose a `data` property', () => {
      file = new File({ app: {} });
      assert.deepEqual(file.data, {});
      assert(file.hasOwnProperty('data'));
    });

    it('should add `data` when passed on the constructor', () => {
      file = new File({ data: { foo: 'bar' } });
      assert.equal(file.data.foo, 'bar');
    });

    it('should add `locals` when passed on the constructor', () => {
      file = new File({ locals: { foo: 'bar' } });
      assert.equal(file.locals.foo, 'bar');
    });
  });

  describe('file.isFile()', () => {
    it('should return true on a vinyl object', () => {
      const file = new File();
      assert.equal(File.isFile(file), true);
    });
    it('should return false on a normal object', () => {
      assert.equal(File.isFile({}), false);
    });
    it('should return false on a null object', () => {
      assert.equal(File.isFile({}), false);
    });
  });

  describe('file.constructor()', () => {
    it('should throw an error if value is a string', () => {
      assert.throws(() => new File('foo'), /expected/);
    });

    it('should default cwd to process.cwd', () => {
      const file = new File();
      assert.equal(file.cwd, process.cwd());
    });

    it('should default base to cwd', () => {
      const cwd = '/';
      const file = new File({ cwd: cwd });
      assert.equal(file.base, cwd);
    });

    it('should default base to cwd even when none is given', () => {
      const file = new File();
      assert.equal(file.base, process.cwd());
    });

    it('should default path to null', () => {
      const file = new File();
      assert(!file.path);
    });

    it('should default history to []', () => {
      const file = new File();
      assert.deepEqual(file.history, []);
    });

    it('should default stat to null', () => {
      const file = new File();
      assert(!file.stat);
    });

    it('should default contents to null', () => {
      const file = new File();
      assert(!file.contents);
    });

    it('should set base to given value', () => {
      const val = '/';
      const file = new File({ base: val });
      assert.equal(file.base, val);
    });

    it('should set cwd to given value', () => {
      const val = '/';
      const file = new File({ cwd: val });
      assert.equal(file.cwd, val);
    });

    it('should set path to given value', () => {
      const val = '/test.coffee';
      const file = new File({ path: val });
      assert.equal(file.path, val);
      assert.deepEqual(file.history, [val]);
    });

    it('should set given value to history', () => {
      const val = '/test.coffee';
      const file = new File({ path: val });
      assert.equal(file.path, val);
      assert.deepEqual(file.history, [val]);
    });

    it('should set contents to given value', () => {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert.equal(file.contents, val);
    });
  });

  describe('file.isBinary()', () => {
    it('should return false when the contents are a utf8 Buffer', () => {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert.equal(file.isBinary(), false);
    });

    it('should return false when the contents are a Stream', () => {
      const val = new Stream.PassThrough();
      const file = new File({ contents: val });
      assert(!file.isBinary());
    });

    it('should return false when file.contents are null', () => {
      const file = new File({ contents: null });
      assert(!file.isBinary());
    });

    it('should return true file.extname is a binary extension', () => {
      assert(new File({ path: 'foo.jpg' }).isBinary());
      assert(new File({ path: 'foo.png' }).isBinary());
      assert(new File({ path: 'foo.pdf' }).isBinary());
    });

    it('should return true when file.contents is binary', () => {
      const file = new File({ contents: null });
      assert(!file.isBinary());
    });

    it('should return true when file.contents is binary', () => {
      new File({ contents: fs.readFileSync(fixture('octdrey-catburn.jpg')) });
      new File({ contents: fs.readFileSync(fixture('octocat.png')) });
    });
  });

  describe('file.isBuffer()', () => {
    it('should return true when the contents are a Buffer', () => {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert.equal(file.isBuffer(), true);
    });

    it('should return false when the contents are a Stream', () => {
      const val = new Stream.PassThrough();
      const file = new File({ contents: val });
      assert(!file.isBuffer());
    });

    it('should return false when the contents are null', () => {
      const file = new File({ contents: null });
      assert(!file.isBuffer());
    });
  });

  describe('isStream()', () => {
    it('should return false when the contents are a Buffer', () => {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert(!file.isStream());
    });

    it('should return true when the contents are a Stream', () => {
      const val = new Stream.PassThrough();
      const file = new File({ contents: val });
      assert.equal(file.isStream(), true);
    });

    it('should return false when the contents are null', () => {
      const file = new File({ contents: null });
      assert(!file.isStream());
    });
  });

  describe('isNull()', () => {
    it('should return false when the contents are a Buffer', () => {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert(!file.isNull());
    });

    it('should return false when the contents are a Stream', () => {
      const val = new Stream.PassThrough();
      const file = new File({ contents: val });
      assert(!file.isNull());
    });

    it('should return true when the contents are null', () => {
      const file = new File({ contents: null });
      assert.equal(file.isNull(), true);
    });
  });

  describe('isDirectory()', () => {
    const fakeStat = {
      isDirectory: function() {
        return true;
      }
    };

    it('should return false when the contents are a Buffer', () => {
      const val = Buffer.from('test');
      const file = new File({ contents: val, stat: fakeStat });
      assert(!file.isDirectory());
    });

    it('should return false when file.stat does not exist', () => {
      const file = new File({ path: 'fofofofofo', stat: null });
      assert(!file.isDirectory());
    });

    it('should return false when the contents are a Stream', () => {
      const val = new Stream.PassThrough();
      const file = new File({ contents: val, stat: fakeStat });
      assert(!file.isDirectory());
    });

    it('should return true when the contents are null', () => {
      const file = new File({ contents: null, stat: fakeStat });
      assert.equal(file.isDirectory(), true);
    });
  });

  describe('inspect()', () => {
    it('should return correct format when no contents and no path', () => {
      const file = new File();
      assert.equal(file[util.inspect.custom](), '<File >');
    });

    it('should return correct format when Buffer and no path', () => {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert.equal(file[util.inspect.custom](), '<File <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Buffer and relative path', () => {
      const val = Buffer.from('test');
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: val
      });
      assert.equal(file[util.inspect.custom](), '<File "/test/test.coffee" <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Buffer and only path and no base', () => {
      const val = Buffer.from('test');
      const file = new File({
        cwd: '/',
        path: '/test/test.coffee',
        contents: val
      });
      delete file.base;
      assert.equal(file[util.inspect.custom](), '<File "/test/test.coffee" <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Stream and relative path', () => {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Stream.PassThrough()
      });
      assert.equal(file[util.inspect.custom](), '<File "/test/test.coffee" <PassThroughStream>>');
    });

    it('should return correct format when null and relative path', () => {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      });
      assert.equal(file[util.inspect.custom](), '<File "/test/test.coffee">');
    });
  });

  describe('file.contents get/set', () => {
    it('should work with Buffer', () => {
      const val = Buffer.from('test');
      const file = new File();
      file.contents = val;
      assert.equal(file.contents, val);
    });

    it.skip('should work with Stream', () => {
      const val = new Stream.PassThrough();
      const file = new File();
      file.contents = val;
      assert.equal(file.contents, val);
    });

    it('should work with null', () => {
      const val = null;
      const file = new File();
      file.contents = val;
      assert.equal(file.contents, null);
    });

    it('should not throw when user attempts to set a string on contents', () => {
      const file = new File();
      assert.doesNotThrow(() => {
        file.contents = 'test';
      });
    });
  });

  describe('file.size', () => {
    it('should work with Buffer', () => {
      const val = Buffer.from('test');
      const file = new File();
      file.contents = val;
      assert.equal(file.contents, val);
    });
  });

  describe('file.layout', () => {
    it('should set the layout on file.layout', () => {
      file = new File({ path: 'test/fixture', layout: 'default' });
      assert.equal(file.layout, 'default');
    });

    it('should make file.layout undefined when file.kind is partial', () => {
      file = new File({ path: 'test/fixture', layout: 'default', kind: 'partial' });
      assert.equal(file.layout, undefined);
    });
  });

  describe('file.engine', () => {
    it('should set the engine on file.engine', () => {
      file = new File({ path: 'test/fixture', engine: '.hbs' });
      assert.equal(file.engine, '.hbs');
    });

    it('should add a leading dot if not defined by user', () => {
      file = new File({ path: 'test/fixture', engine: 'hbs' });
      assert.equal(file.engine, '.hbs');
    });
  });

  describe('file.hasPath', () => {
    it('should return false when file.path is undefined', () => {
      file = new File();
      assert(!file.hasPath());
    });

    it('should return true when the file has the given path', () => {
      file = new File({ path: 'test/fixtures' });
      assert(file.hasPath('fixtures'));
    });

    it('should return true when the file does not have the given path', () => {
      file = new File({ path: 'test/fixtures' });
      assert(!file.hasPath('slsllslslsl'));
    });

    it('should take a function', () => {
      file = new File({ path: 'test/fixtures' });
      assert(file.hasPath(file => file.stem === 'fixtures'));
    });

    it('should take a regex', () => {
      file = new File({ path: 'test/fixtures' });
      assert(file.hasPath(/fixtures/));
    });

    it('should test file.history[0] with regex', () => {
      file = new File({ path: 'test/fixture.hbs' });
      file.extname = '.html';
      assert(file.hasPath(/fixture\.hbs/));
    });
  });

  describe('file.cwd', () => {
    it('should get properties from the object', () => {
      file = new File({ cwd: 'test/fixtures' });
      assert.equal(file.cwd, 'test/fixtures');
    });
  });

  describe('file.absolute get/set', () => {
    it('should throw an error when user attempts to set on file.absolute', () => {
      const file = new File();
      assert.throws(() => {
        file.absolute = 'test';
      });
    });

    it('should get absolute path', () => {
      const file = new File({ path: 'test' });
      assert.equal(file.absolute, path.resolve('test'));
    });
  });

  describe('file.relative get/set', () => {
    it('should throw an error when user attempts to set on file.relative', () => {
      const file = new File();
      assert.throws(() => {
        file.relative = 'test';
      });
    });

    it('should error on get when no base', () => {
      const file = new File();
      delete file.base;
      assert.throws(() => file.relative);
    });

    it('should error on get when no path', () => {
      const file = new File();
      assert.throws(() => file.relative);
    });

    it('should return a relative path from base', () => {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(file.relative, 'test.coffee');
    });

    it('should return a relative path from cwd', () => {
      const file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });
      assert.equal(file.relative, path.join('test', 'test.coffee'));
    });
  });

  describe('file.dirname get/set', () => {
    it('should error on get when no path', () => {
      const file = new File();
      assert.throws(() => file.dirname);
    });

    it('should return the dirname of the path', () => {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(file.dirname, '/test');
    });

    it('should error on set when no path', () => {
      const file = new File();
      try {
        file.dirname = '/test';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the dirname of the path', () => {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      file.dirname = '/test/foo';
      assert.equal(file.path, '/test/foo/test.coffee');
    });
  });

  describe('file.stem get/set', () => {
    it('should get file.stem', () => {
      const file = new File({ path: path.resolve('test.js') });
      assert.equal(file.stem, 'test');
    });

    it('should set file.stem', () => {
      const file = new File({ path: path.resolve('test.js') });
      file.stem = 'foo';
      assert.equal(file.basename, 'foo.js');
    });
  });

  describe('file.basename get/set', () => {
    it('should error on get when no path', () => {
      const file = new File();
      try {
        file.basename;
      } catch (err) {
        assert(err);
      }
    });

    it('should return the basename of the path', () => {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(file.basename, 'test.coffee');
    });

    it('should error on set when no path', () => {
      const file = new File();
      try {
        file.basename = 'test.coffee';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the basename of the path', () => {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      file.basename = 'foo.png';
      assert.equal(file.path, '/test/foo.png');
    });
  });

  describe('file.extname get/set', () => {
    it('should error on get when no path', () => {
      const file = new File();
      assert.throws(() => file.extname);
    });

    it('should return the extname of the path', () => {
      const file = new File({ cwd: '/', base: '/test/', path: '/test/test.coffee' });
      assert.equal(file.extname, '.coffee');
    });

    it('should error on set when no path', () => {
      const file = new File();
      try {
        file.extname = '.coffee';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the extname of the path', () => {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      file.extname = '.png';
      assert.equal(file.path, '/test/test.png');
    });
  });

  describe('file.path get/set', () => {
    it('should record history when instantiation', () => {
      const file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });

      assert.deepEqual(file.path, '/test/test.coffee');
      assert.deepEqual(file.history, ['/test/test.coffee']);
    });

    it('should record history when path change', () => {
      const file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });

      file.path = '/test/test.js';
      assert.deepEqual(file.path, '/test/test.js');
      assert.deepEqual(file.history, ['/test/test.coffee', '/test/test.js']);

      file.path = '/test/test.coffee';
      assert.deepEqual(file.path, '/test/test.coffee');
      assert.deepEqual(file.history, ['/test/test.coffee', '/test/test.js', '/test/test.coffee']);
    });

    it('should not record history when set the same path', () => {
      const file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });

      file.path = '/test/test.coffee';
      file.path = '/test/test.coffee';
      assert.deepEqual(file.path, '/test/test.coffee');
      assert.deepEqual(file.history, ['/test/test.coffee']);

      // ignore when set empty string
      file.path = '';
      assert.deepEqual(file.path, '/test/test.coffee');
      assert.deepEqual(file.history, ['/test/test.coffee']);
    });

    it('should throw when set path null', () => {
      assert.throws(() => {
        file = new File({ cwd: '/', path: 'foo' });
        file.path = null;
      }, /string/);
    });
  });
});
