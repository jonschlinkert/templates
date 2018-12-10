'use strict';

const fs = require('fs');
const os = require('os');
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

  describe('file.clone()', () => {
    it('should clone custom properties', () => {
      let file = new File({ foo: ['a', 'b', 'c'], bar: null });
      let cloned = file.clone();
      assert(Array.isArray(cloned.foo) && cloned.foo.length === 3);
      assert(file.foo !== cloned.foo);
      assert.equal(cloned.bar, null);
    });
  });

  describe('file.isFile()', () => {
    it('should return true on a vinyl object', () => {
      let file = new File();
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
      let file = new File();
      assert.equal(file.cwd, process.cwd());
    });

    it('should default base to cwd', () => {
      const cwd = '/';
      let file = new File({ cwd: cwd });
      assert.equal(file.base, cwd);
    });

    it('should default base to cwd even when none is given', () => {
      let file = new File();
      assert.equal(file.base, process.cwd());
    });

    it('should default path to null', () => {
      let file = new File();
      assert(!file.path);
    });

    it('should default history to []', () => {
      let file = new File();
      assert.deepEqual(file.history, []);
    });

    it('should default stat to null', () => {
      let file = new File();
      assert(!file.stat);
    });

    it('should default contents to null', () => {
      let file = new File();
      assert(!file.contents);
    });

    it('should set cwd to given value', () => {
      let val = '/';
      let file = new File({ cwd: val });
      assert.equal(file.cwd, val);
    });

    it('should set path to given value', () => {
      let val = '/test.coffee';
      let file = new File({ path: val });
      assert.equal(file.path, val);
      assert.deepEqual(file.history, [val]);
    });

    it('should set given value to history', () => {
      let val = '/test.coffee';
      let file = new File({ path: val });
      assert.equal(file.path, val);
      assert.deepEqual(file.history, [val]);
    });

    it('should set contents to given value', () => {
      let val = Buffer.from('test');
      let file = new File({ contents: val });
      assert.equal(file.contents, val);
    });

    it('should set base to given value', () => {
      let val = '/';
      let file = new File({ base: val });
      assert.equal(file.base, val);
    });
  });

  describe('File.resolve', () => {
    it('should return an absolute file path', () => {
      assert.equal(File.resolve('foo'), path.resolve('foo'));
    });
  });

  describe('File.normalize', () => {
    it('should normalize a file path', () => {
      assert.equal(File.normalize(), '');
      assert.equal(File.normalize('foo\\bar'), 'foo/bar');
      assert.equal(File.normalize('foo\\bar\\'), 'foo/bar');
      assert.equal(File.normalize('foo/bar/'), 'foo/bar');
    });
  });

  describe('file.folder', () => {
    it('should get the correct file.folder for non-existant files', () => {
      assert.equal(new File({ path: 'foo' }).folder, '');
      assert.equal(new File({ path: path.resolve('bar/foo') }).folder, 'bar');
      assert.equal(new File({ path: 'bar/foo' }).folder, 'bar');
      assert.equal(new File({ path: 'bar/foo/baz.js' }).folder, 'foo');
    });

    it('should get the file.folder for files that exist', () => {
      let resolve = name => path.resolve(__dirname, name);
      assert.equal(new File({ path: __filename }).folder, 'test');
      assert.equal(new File({ path: resolve('fixtures/a.txt') }).folder, 'fixtures');
      assert.equal(new File({ path: resolve('../index.js') }).folder, '');
    });

    it('should get the file.folder when file is a directory', () => {
      let resolve = name => path.resolve(__dirname, name);
      let file1 = new File({ path: __dirname });
      file1.stat = fs.statSync(file1.path);

      let file2 = new File({ path: resolve('fixtures') });
      file2.stat = fs.statSync(file2.path);

      assert.equal(file1.folder, 'test');
      assert.equal(file2.folder, 'fixtures');
    });
  });

  describe('file.size', () => {
    it('should get the file.size', () => {
      assert.equal(new File({ contents: 'foo' }).size, 3);
      assert.equal(new File({ contents: Buffer.from('foobar') }).size, 6);
      let fp = fixture('octocat.png');
      let file = new File({ path: fp, contents: fs.readFileSync(fp) });
      file.stat = fs.statSync(file.path);
      assert.equal(file.size, 4936);
    });

    it('should be zero when contents is null', () => {
      assert.equal(new File({ contents: null }).size, 0);
    });

    it('should throw an error if file.size is set', () => {
      let file = new File({ contents: null });
      assert.throws(() => {
        file.size = 10;
      }, /may not be defined/);
    });
  });

  describe('file.isBinary()', () => {
    it('should return false when the contents are a utf8 Buffer', () => {
      let val = Buffer.from('test');
      let file = new File({ contents: val });
      assert.equal(file.isBinary(), false);
    });

    it('should return false when the contents are a Stream', () => {
      let val = new Stream.PassThrough();
      let file = new File({ contents: val });
      assert(!file.isBinary());
    });

    it('should return false when file.contents are null', () => {
      let file = new File({ contents: null });
      assert(!file.isBinary());
    });

    it('should return true file.extname is a binary extension', () => {
      assert(new File({ path: 'foo.jpg' }).isBinary());
      assert(new File({ path: 'foo.png' }).isBinary());
      assert(new File({ path: 'foo.pdf' }).isBinary());
    });

    it('should return true when file.contents is binary', () => {
      let file = new File({ contents: null });
      assert(!file.isBinary());
    });

    it('should return true when file.contents is binary', () => {
      let file1 = new File({ contents: fs.readFileSync(fixture('octdrey-catburn.jpg')) });
      let file2 = new File({ contents: fs.readFileSync(fixture('octocat.png')) });
      assert(file1.isBinary());
      assert(file2.isBinary());
    });
  });

  describe('file.isBuffer()', () => {
    it('should return true when the contents are a Buffer', () => {
      let val = Buffer.from('test');
      let file = new File({ contents: val });
      assert.equal(file.isBuffer(), true);
    });

    it('should return false when the contents are a Stream', () => {
      let val = new Stream.PassThrough();
      let file = new File({ contents: val });
      assert(!file.isBuffer());
    });

    it('should return false when the contents are null', () => {
      let file = new File({ contents: null });
      assert(!file.isBuffer());
    });
  });

  describe('isStream()', () => {
    it('should return false when the contents are a Buffer', () => {
      let val = Buffer.from('test');
      let file = new File({ contents: val });
      assert(!file.isStream());
    });

    it('should return true when the contents are a Stream', () => {
      let val = new Stream.PassThrough();
      let file = new File({ contents: val });
      assert.equal(file.isStream(), true);
    });

    it('should return false when the contents are null', () => {
      let file = new File({ contents: null });
      assert(!file.isStream());
    });
  });

  describe('isNull()', () => {
    it('should return false when the contents are a Buffer', () => {
      let val = Buffer.from('test');
      let file = new File({ contents: val });
      assert(!file.isNull());
    });

    it('should return false when the contents are a Stream', () => {
      let val = new Stream.PassThrough();
      let file = new File({ contents: val });
      assert(!file.isNull());
    });

    it('should return true when the contents are null', () => {
      let file = new File({ contents: null });
      assert.equal(file.isNull(), true);
    });
  });

  describe('isDirectory()', () => {
    const fakeStat = {
      isDirectory: () => {
        return true;
      }
    };

    it('should return false when the contents are a Buffer', () => {
      let val = Buffer.from('test');
      let file = new File({ contents: val, stat: fakeStat });
      assert(!file.isDirectory());
    });

    it('should return false when file.stat does not exist', () => {
      let file = new File({ path: 'fofofofofo', stat: null });
      assert(!file.isDirectory());
    });

    it('should return false when the contents are a Stream', () => {
      let val = new Stream.PassThrough();
      let file = new File({ contents: val, stat: fakeStat });
      assert(!file.isDirectory());
    });

    it('should return true when the contents are null', () => {
      let file = new File({ contents: null, stat: fakeStat });
      assert.equal(file.isDirectory(), true);
    });
  });

  describe('inspect()', () => {
    it('should return correct format when no contents and no path', () => {
      let file = new File();
      assert.equal(file[util.inspect.custom](), '<File >');
    });

    it('should return correct format when Buffer and no path', () => {
      let val = Buffer.from('test');
      let file = new File({ contents: val });
      assert.equal(file[util.inspect.custom](), '<File <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Buffer and relative path', () => {
      let val = Buffer.from('test');
      let file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: val
      });
      assert.equal(file[util.inspect.custom](), '<File "/test/test.coffee" <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Buffer and only path and no base', () => {
      let val = Buffer.from('test');
      let file = new File({
        cwd: '/',
        path: '/test/test.coffee',
        contents: val
      });
      delete file.base;
      assert.equal(file[util.inspect.custom](), '<File "/test/test.coffee" <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Stream and relative path', () => {
      let file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Stream.PassThrough()
      });
      assert.equal(file[util.inspect.custom](), '<File "/test/test.coffee" <PassThroughStream>>');
    });

    it('should return correct format when null and relative path', () => {
      let file = new File({
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
      let val = Buffer.from('test');
      let file = new File();
      file.contents = val;
      assert.equal(file.contents, val);
    });

    it('should work with Stream', () => {
      let val = new Stream();
      let file = new File({ contents: val });
      assert.equal(file.contents, val);
    });

    it('should work with null', () => {
      let val = null;
      let file = new File();
      file.contents = val;
      assert.equal(file.contents, null);
    });

    it('should not throw when user attempts to set a string on contents', () => {
      let file = new File();
      assert.doesNotThrow(() => {
        file.contents = 'test';
      });
    });
  });

  describe('file.size', () => {
    it('should work with Buffer', () => {
      let val = Buffer.from('test');
      let file = new File();
      file.contents = val;
      assert.equal(file.contents, val);
    });
  });

  describe('file.layout', () => {
    it('should set the layout on file.layout', () => {
      file = new File({ path: 'test/fixture', layout: 'default' });
      assert.equal(file.layout, 'default');
    });

    it('should make file.layout undefined when file.type is partial', () => {
      file = new File({ path: 'test/fixture', layout: 'default', type: 'partial' });
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
      let file = new File();
      assert.throws(() => {
        file.absolute = 'test';
      });
    });

    it('should get absolute path', () => {
      let file = new File({ path: 'test' });
      assert.equal(file.absolute, path.resolve('test'));
    });
  });

  describe('file.relative get/set', () => {
    it('should throw an error when user attempts to set on file.relative', () => {
      let file = new File();
      assert.throws(() => {
        file.relative = 'test';
      });
    });

    it('should error on get when no base', () => {
      let file = new File();
      delete file.base;
      assert.throws(() => file.relative);
    });

    it('should error on get when no path', () => {
      let file = new File();
      assert.throws(() => file.relative);
    });

    it('should return a relative path from base', () => {
      let file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(file.relative, 'test.coffee');
    });

    it('should return a relative path from cwd', () => {
      let file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });
      assert.equal(file.relative, path.join('test', 'test.coffee'));
    });
  });

  describe('file.dirname get/set', () => {
    it('should error on get when no path', () => {
      let file = new File();
      assert.throws(() => file.dirname);
    });

    it('should return the dirname of the path', () => {
      let file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(file.dirname, '/test');
    });

    it('should error on set when no path', () => {
      let file = new File();
      try {
        file.dirname = '/test';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the dirname of the path', () => {
      let file = new File({
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
      let file = new File({ path: path.resolve('test.js') });
      assert.equal(file.stem, 'test');
    });

    it('should set file.stem', () => {
      let file = new File({ path: path.resolve('test.js') });
      file.stem = 'foo';
      assert.equal(file.basename, 'foo.js');
    });
  });

  describe('file.basename get/set', () => {
    it('should error on get when no path', () => {
      let file = new File();
      try {
        file.basename;
      } catch (err) {
        assert(err);
      }
    });

    it('should return the basename of the path', () => {
      let file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(file.basename, 'test.coffee');
    });

    it('should error on set when no path', () => {
      let file = new File();
      try {
        file.basename = 'test.coffee';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the basename of the path', () => {
      let file = new File({
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
      let file = new File();
      assert.throws(() => file.extname);
    });

    it('should return the extname of the path', () => {
      let file = new File({ cwd: '/', base: '/test/', path: '/test/test.coffee' });
      assert.equal(file.extname, '.coffee');
    });

    it('should error on set when no path', () => {
      let file = new File();
      try {
        file.extname = '.coffee';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the extname of the path', () => {
      let file = new File({
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
      let file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });

      assert.deepEqual(file.path, '/test/test.coffee');
      assert.deepEqual(file.history, ['/test/test.coffee']);
    });

    it('should record history when path change', () => {
      let file = new File({
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
      let file = new File({
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
