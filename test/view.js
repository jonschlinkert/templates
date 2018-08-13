'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');
const Stream = require('stream');
const View = require('../lib/view');
const fixture = name => path.join(__dirname, 'fixtures', name);
let view;

describe('View', () => {
  describe('properties', () => {
    it('should add `options` when passed on the constructor', () => {
      view = new View({ options: { foo: 'bar' } });
      assert.equal(view.options.foo, 'bar');
    });

    it('should expose a `data` property', () => {
      view = new View({ app: {} });
      assert.deepEqual(view.data, {});
      assert(view.hasOwnProperty('data'));
    });

    it('should add `data` when passed on the constructor', () => {
      view = new View({ data: { foo: 'bar' } });
      assert.equal(view.data.foo, 'bar');
    });

    it('should add `locals` when passed on the constructor', () => {
      view = new View({ locals: { foo: 'bar' } });
      assert.equal(view.locals.foo, 'bar');
    });
  });

  describe('file.isView()', () => {
    it('should return true on a vinyl object', () => {
      const view = new View();
      assert.equal(View.isView(view), true);
    });
    it('should return false on a normal object', () => {
      assert.equal(View.isView({}), false);
    });
    it('should return false on a null object', () => {
      assert.equal(View.isView({}), false);
    });
  });

  describe('file.constructor()', () => {
    it('should throw an error if value is a string', () => {
      assert.throws(() => new View('foo'), /expected/);
    });

    it('should default cwd to process.cwd', () => {
      const view = new View();
      assert.equal(view.cwd, process.cwd());
    });

    it('should default base to cwd', () => {
      const cwd = '/';
      const view = new View({ cwd: cwd });
      assert.equal(view.base, cwd);
    });

    it('should default base to cwd even when none is given', () => {
      const view = new View();
      assert.equal(view.base, process.cwd());
    });

    it('should default path to null', () => {
      const view = new View();
      assert(!view.path);
    });

    it('should default history to []', () => {
      const view = new View();
      assert.deepEqual(view.history, []);
    });

    it('should default stat to null', () => {
      const view = new View();
      assert(!view.stat);
    });

    it('should default contents to null', () => {
      const view = new View();
      assert(!view.contents);
    });

    it('should set base to given value', () => {
      const val = '/';
      const view = new View({ base: val });
      assert.equal(view.base, val);
    });

    it('should set cwd to given value', () => {
      const val = '/';
      const view = new View({ cwd: val });
      assert.equal(view.cwd, val);
    });

    it('should set path to given value', () => {
      const val = '/test.coffee';
      const view = new View({ path: val });
      assert.equal(view.path, val);
      assert.deepEqual(view.history, [val]);
    });

    it('should set given value to history', () => {
      const val = '/test.coffee';
      const view = new View({ path: val });
      assert.equal(view.path, val);
      assert.deepEqual(view.history, [val]);
    });

    it('should set contents to given value', () => {
      const val = Buffer.from('test');
      const view = new View({ contents: val });
      assert.equal(view.contents, val);
    });
  });

  describe('file.isBinary()', () => {
    it('should return false when the contents are a utf8 Buffer', () => {
      const val = Buffer.from('test');
      const view = new View({ contents: val });
      assert.equal(view.isBinary(), false);
    });

    it('should return false when the contents are a Stream', () => {
      const val = new Stream();
      const view = new View({ contents: val });
      assert(!view.isBinary());
    });

    it('should return false when file.contents are null', () => {
      const view = new View({ contents: null });
      assert(!view.isBinary());
    });

    it('should return true file.extname is a binary extension', () => {
      assert(new View({ path: 'foo.jpg' }).isBinary());
      assert(new View({ path: 'foo.png' }).isBinary());
      assert(new View({ path: 'foo.pdf' }).isBinary());
    });

    it('should return true when file.contents is binary', () => {
      const view = new View({ contents: null });
      assert(!view.isBinary());
    });

    it('should return true when file.contents is binary', () => {
      new View({ contents: fs.readFileSync(fixture('octdrey-catburn.jpg')) });
      new View({ contents: fs.readFileSync(fixture('octocat.png')) });
    });
  });

  describe('file.isBuffer()', () => {
    it('should return true when the contents are a Buffer', () => {
      const val = Buffer.from('test');
      const view = new View({ contents: val });
      assert.equal(view.isBuffer(), true);
    });

    it('should return false when the contents are a Stream', () => {
      const val = new Stream();
      const view = new View({ contents: val });
      assert(!view.isBuffer());
    });

    it('should return false when the contents are null', () => {
      const view = new View({ contents: null });
      assert(!view.isBuffer());
    });
  });

  describe('isStream()', () => {
    it('should return false when the contents are a Buffer', () => {
      const val = Buffer.from('test');
      const view = new View({ contents: val });
      assert(!view.isStream());
    });

    it('should return true when the contents are a Stream', () => {
      const val = new Stream();
      const view = new View({ contents: val });
      assert.equal(view.isStream(), true);
    });

    it('should return false when the contents are null', () => {
      const view = new View({ contents: null });
      assert(!view.isStream());
    });
  });

  describe('isNull()', () => {
    it('should return false when the contents are a Buffer', () => {
      const val = Buffer.from('test');
      const view = new View({ contents: val });
      assert(!view.isNull());
    });

    it('should return false when the contents are a Stream', () => {
      const val = new Stream();
      const view = new View({ contents: val });
      assert(!view.isNull());
    });

    it('should return true when the contents are null', () => {
      const view = new View({ contents: null });
      assert.equal(view.isNull(), true);
    });
  });

  describe('isDirectory()', () => {
    const fakeStat = {
      isDirectory: () => {
        return true;
      }
    };

    it('should return false when the contents are a Buffer', () => {
      const val = Buffer.from('test');
      const view = new View({ contents: val, stat: fakeStat });
      assert(!view.isDirectory());
    });

    it('should return false when view.stat does not exist', () => {
      const view = new View({ path: 'fofofofofo', stat: null });
      assert(!view.isDirectory());
    });

    it('should return false when the contents are a Stream', () => {
      const val = new Stream();
      const view = new View({ contents: val, stat: fakeStat });
      assert(!view.isDirectory());
    });

    it('should return true when the contents are null', () => {
      const view = new View({ contents: null, stat: fakeStat });
      assert.equal(view.isDirectory(), true);
    });
  });

  describe('inspect()', () => {
    it('should return correct format when no contents and no path', () => {
      const view = new View();
      assert.equal(view[util.inspect.custom](), '<View >');
    });

    it('should return correct format when Buffer and no path', () => {
      const val = Buffer.from('test');
      const view = new View({ contents: val });
      assert.equal(view[util.inspect.custom](), '<View <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Buffer and relative path', () => {
      const val = Buffer.from('test');
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: val
      });
      assert.equal(view[util.inspect.custom](), '<View "test.coffee" <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Buffer and only path and no base', () => {
      const val = Buffer.from('test');
      const view = new View({
        cwd: '/',
        path: '/test/test.coffee',
        contents: val
      });
      delete view.base;
      assert.equal(view[util.inspect.custom](), '<View "test/test.coffee" <Buffer 74 65 73 74>>');
    });

    it('should return correct format when Stream and relative path', () => {
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: new Stream.PassThrough()
      });
      assert.equal(view[util.inspect.custom](), '<View "test.coffee" <PassThroughStream>>');
    });

    it('should return correct format when null and relative path', () => {
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      });
      assert.equal(view[util.inspect.custom](), '<View "test.coffee">');
    });
  });

  describe('file.contents get/set', () => {
    it('should work with Buffer', () => {
      const val = Buffer.from('test');
      const view = new View();
      view.contents = val;
      assert.equal(view.contents, val);
    });

    it('should work with Stream', () => {
      const val = new Stream.PassThrough();
      const view = new View();
      view.contents = val;
      assert.equal(view.contents, val);
    });

    it('should work with null', () => {
      const val = null;
      const view = new View();
      view.contents = val;
      assert.equal(view.contents, null);
    });

    it('should not throw when user attempts to set a string on contents', () => {
      const view = new View();
      assert.doesNotThrow(() => {
        view.contents = 'test';
      });
    });
  });

  describe('file.size', () => {
    it('should work with Buffer', () => {
      const val = Buffer.from('test');
      const view = new View();
      view.contents = val;
      assert.equal(view.contents, val);
    });
  });

  describe('file.layout', () => {
    it('should set the layout on view.layout', () => {
      view = new View({ path: 'test/fixture', layout: 'default' });
      assert.equal(view.layout, 'default');
    });

    it('should make view.layout undefined when view.kind is partial', () => {
      view = new View({ path: 'test/fixture', layout: 'default', kind: 'partial' });
      assert.equal(view.layout, undefined);
    });
  });

  describe('file.engine', () => {
    it('should set the engine on view.engine', () => {
      view = new View({ path: 'test/fixture', engine: '.hbs' });
      assert.equal(view.engine, '.hbs');
    });

    it('should add a leading dot if not defined by user', () => {
      view = new View({ path: 'test/fixture', engine: 'hbs' });
      assert.equal(view.engine, '.hbs');
    });
  });

  describe('file.hasPath', () => {
    it('should return false when view.path is undefined', () => {
      view = new View();
      assert(!view.hasPath());
    });

    it('should return true when the view has the given path', () => {
      view = new View({ path: 'test/fixtures' });
      assert(view.hasPath('fixtures'));
    });

    it('should return true when the view does not have the given path', () => {
      view = new View({ path: 'test/fixtures' });
      assert(!view.hasPath('slsllslslsl'));
    });

    it('should take a function', () => {
      view = new View({ path: 'test/fixtures' });
      assert(view.hasPath(view => view.stem === 'fixtures'));
    });

    it('should take a regex', () => {
      view = new View({ path: 'test/fixtures' });
      assert(view.hasPath(/fixtures/));
    });

    it('should test view.history[0] with regex', () => {
      view = new View({ path: 'test/fixture.hbs' });
      view.extname = '.html';
      assert(view.hasPath(/fixture\.hbs/));
    });
  });

  describe('file.cwd', () => {
    it('should get properties from the object', () => {
      view = new View({ cwd: 'test/fixtures' });
      assert.equal(view.cwd, path.resolve(__dirname, 'fixtures'));
    });
  });

  describe('file.absolute get/set', () => {
    it('should throw an error when user attempts to set on view.absolute', () => {
      const view = new View();
      assert.throws(() => {
        view.absolute = 'test';
      });
    });

    it('should get absolute path', () => {
      const view = new View({ path: 'test' });
      assert.equal(view.absolute, path.resolve('test'));
    });
  });

  describe('file.relative get/set', () => {
    it('should throw an error when user attempts to set on view.relative', () => {
      const view = new View();
      assert.throws(() => {
        view.relative = 'test';
      });
    });

    it('should error on get when no base', () => {
      const view = new View();
      delete view.base;
      assert.throws(() => view.relative);
    });

    it('should error on get when no path', () => {
      const view = new View();
      assert.throws(() => view.relative);
    });

    it('should return a relative path from base', () => {
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(view.relative, 'test.coffee');
    });

    it('should return a relative path from cwd', () => {
      const view = new View({
        cwd: '/',
        path: '/test/test.coffee'
      });
      assert.equal(view.relative, path.join('test', 'test.coffee'));
    });
  });

  describe('file.dirname get/set', () => {
    it('should error on get when no path', () => {
      const view = new View();
      assert.throws(() => view.dirname);
    });

    it('should return the dirname of the path', () => {
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(view.dirname, '/test');
    });

    it('should error on set when no path', () => {
      const view = new View();
      try {
        view.dirname = '/test';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the dirname of the path', () => {
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.dirname = '/test/foo';
      assert.equal(view.path, '/test/foo/test.coffee');
    });
  });

  describe('file.stem get/set', () => {
    it('should get view.stem', () => {
      const view = new View({ path: path.resolve('test.js') });
      assert.equal(view.stem, 'test');
    });

    it('should set view.stem', () => {
      const view = new View({ path: path.resolve('test.js') });
      view.stem = 'foo';
      assert.equal(view.basename, 'foo.js');
    });
  });

  describe('file.basename get/set', () => {
    it('should error on get when no path', () => {
      const view = new View();
      try {
        view.basename;
      } catch (err) {
        assert(err);
      }
    });

    it('should return the basename of the path', () => {
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      assert.equal(view.basename, 'test.coffee');
    });

    it('should error on set when no path', () => {
      const view = new View();
      try {
        view.basename = 'test.coffee';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the basename of the path', () => {
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.basename = 'foo.png';
      assert.equal(view.path, '/test/foo.png');
    });
  });

  describe('file.extname get/set', () => {
    it('should error on get when no path', () => {
      const view = new View();
      assert.throws(() => view.extname);
    });

    it('should return the extname of the path', () => {
      const view = new View({ cwd: '/', base: '/test/', path: '/test/test.coffee' });
      assert.equal(view.extname, '.coffee');
    });

    it('should error on set when no path', () => {
      const view = new View();
      try {
        view.extname = '.coffee';
      } catch (err) {
        assert(err);
      }
    });

    it('should set the extname of the path', () => {
      const view = new View({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });
      view.extname = '.png';
      assert.equal(view.path, '/test/test.png');
    });
  });

  describe('file.path get/set', () => {
    it('should record history when instantiation', () => {
      const view = new View({
        cwd: '/',
        path: '/test/test.coffee'
      });

      assert.deepEqual(view.path, '/test/test.coffee');
      assert.deepEqual(view.history, ['/test/test.coffee']);
    });

    it('should record history when path change', () => {
      const view = new View({
        cwd: '/',
        path: '/test/test.coffee'
      });

      view.path = '/test/test.js';
      assert.deepEqual(view.path, '/test/test.js');
      assert.deepEqual(view.history, ['/test/test.coffee', '/test/test.js']);

      view.path = '/test/test.coffee';
      assert.deepEqual(view.path, '/test/test.coffee');
      assert.deepEqual(view.history, ['/test/test.coffee', '/test/test.js', '/test/test.coffee']);
    });

    it('should not record history when set the same path', () => {
      const view = new View({
        cwd: '/',
        path: '/test/test.coffee'
      });

      view.path = '/test/test.coffee';
      view.path = '/test/test.coffee';
      assert.deepEqual(view.path, '/test/test.coffee');
      assert.deepEqual(view.history, ['/test/test.coffee']);

      // ignore when set empty string
      view.path = '';
      assert.deepEqual(view.path, '/test/test.coffee');
      assert.deepEqual(view.history, ['/test/test.coffee']);
    });

    it('should throw when set path null', () => {
      assert.throws(() => {
        view = new View({ cwd: '/', path: 'foo' });
        view.path = null;
      }, /expected.*path.*string/);
    });
  });
});
