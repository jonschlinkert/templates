'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');
const { concat, pipe, from } = require('mississippi');
const Cloneable = require('../lib/streams/cloneable');
const File = require('../lib/vinyl');
const inspect = file => file[util.inspect.custom]();

describe('File', function() {
  describe('isFile()', function() {
    it('returns true for a Vinyl object', function() {
      const file = new File();
      assert(File.isFile(file));
    });

    it('returns false for a normal object', function() {
      const result = File.isFile({});
      assert.equal(result, false);
    });

    it('returns false for null', function() {
      const result = File.isFile(null);
      assert.equal(result, false);
    });

    it('returns false for a string', function() {
      const result = File.isFile('foobar');
      assert.equal(result, false);
    });

    it('returns false for a plain object', function() {
      const result = File.isFile({});
      assert.equal(result, false);
    });

    it('returns false for a number', function() {
      const result = File.isFile(1);
      assert.equal(result, false);
    });

    // This is based on current implementation
    // A test was added to document and make aware during internal changes
    // TODO: decide if this should be leak-able
    it('returns true for a mocked object', function() {
      const result = File.isFile({ _isFile: true });
      assert(result);
    });
  });

  describe('defaults', function() {
    it('defaults cwd to process.cwd', function() {
      const file = new File();
      assert.equal(file.cwd, process.cwd());
    });

    it('defaults base to process.cwd', function() {
      const file = new File();
      assert.equal(file.base, process.cwd());
    });

    it('defaults base to cwd property', function() {
      const cwd = path.normalize('/');
      const file = new File({ cwd: cwd });
      assert.equal(file.base, cwd);
    });

    it('defaults path to null', function() {
      const file = new File();
      assert(!file.path);
      assert.equal(file.path, null);
    });

    it('defaults history to an empty array', function() {
      const file = new File();
      assert.deepEqual(file.history, []);
    });

    it('defaults stat to null', function() {
      const file = new File();
      assert(!file.stat);
      assert.equal(file.stat, null);
    });

    it('defaults contents to null', function() {
      const file = new File();
      assert(!file.contents);
      assert.equal(file.contents, null);
    });
  });

  describe('constructor()', function() {
    it('sets base', function() {
      const val = path.normalize('/');
      const file = new File({ base: val });
      assert.equal(file.base, val);
    });

    it('sets cwd', function() {
      const val = path.normalize('/');
      const file = new File({ cwd: val });
      assert.equal(file.cwd, val);
    });

    it('sets path (and history)', function() {
      const val = path.normalize('/test.coffee');
      const file = new File({ path: val });
      assert.equal(file.path, val);
      assert.deepEqual(file.history, [val]);
    });

    it('sets history (and path)', function() {
      const val = path.normalize('/test.coffee');
      const file = new File({ history: [val] });
      assert.equal(file.path, val);
      assert.deepEqual(file.history, [val]);
    });

    it('sets stat', function() {
      const val = {};
      const file = new File({ stat: val });
      assert.equal(file.stat, val);
    });

    it('sets contents', function() {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert.equal(file.contents, val);
    });

    it('sets custom properties', function() {
      const sourceMap = {};
      const file = new File({ sourceMap: sourceMap });
      assert.equal(file.sourceMap, sourceMap);
    });

    it('normalizes path', function() {
      const val = '/test/foo/../test.coffee';
      const file = new File({ path: val });
      const expected = path.normalize(val);
      assert.equal(file.path, expected);
      assert.deepEqual(file.history, [expected]);
    });

    it('normalizes and removes trailing separator from path', function() {
      const val = '/test/foo/../foo/';
      const file = new File({ path: val });
      const expected = path.normalize(val.slice(0, -1));
      assert.equal(file.path, expected);
    });

    it('normalizes history', function() {
      const val = [
        '/test/bar/../bar/test.coffee',
        '/test/foo/../test.coffee'
      ];
      const expected = val.map(function(p) {
        return path.normalize(p);
      });
      const file = new File({ history: val });
      assert.equal(file.path, expected[1]);
      assert.deepEqual(file.history, expected);
    });

    it('normalizes and removes trailing separator from history', function() {
      const val = [
        '/test/foo/../foo/',
        '/test/bar/../bar/'
      ];
      const expected = val.map(function(p) {
        return path.normalize(p.slice(0, -1));
      });
      const file = new File({ history: val });
      assert.deepEqual(file.history, expected);
    });

    it('appends path to history if both exist and different from last', function() {
      const val = path.normalize('/test/baz/test.coffee');
      const history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee')
      ];
      const file = new File({ path: val, history: history });

      const expectedHistory = history.concat(val);

      assert.equal(file.path, val);
      assert.deepEqual(file.history, expectedHistory);
    });

    it('does not append path to history if both exist and same as last', function() {
      const val = path.normalize('/test/baz/test.coffee');
      const history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee'),
        val
      ];
      const file = new File({ path: val, history: history });

      assert.equal(file.path, val);
      assert.deepEqual(file.history, history);
    });

    it('does not mutate history array passed in', function() {
      const val = path.normalize('/test/baz/test.coffee');
      const history = [
        path.normalize('/test/bar/test.coffee'),
        path.normalize('/test/foo/test.coffee')
      ];

      const historyCopy = Array.prototype.slice.call(history);
      const file = new File({ path: val, history: history });
      const expectedHistory = history.concat(val);

      assert.equal(file.path, val);
      assert.deepEqual(file.history, expectedHistory);
      assert.deepEqual(history, historyCopy);
    });
  });

  describe('isBuffer()', function() {
    it('returns true when the contents are a Buffer', function() {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert(file.isBuffer());
    });

    it('returns false when the contents are a Stream', function() {
      const val = from([]);
      const file = new File({ contents: val });
      assert.equal(file.isBuffer(), false);
    });

    it('returns false when the contents are null', function() {
      const file = new File({ contents: null });
      assert.equal(file.isBuffer(), false);
    });
  });

  describe('isStream()', function() {
    it('returns false when the contents are a Buffer', function() {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert.equal(file.isStream(), false);
    });

    it('returns true when the contents are a Stream', function() {
      const val = from([]);
      const file = new File({ contents: val });
      assert(file.isStream());
    });

    it('returns false when the contents are null', function() {
      const file = new File({ contents: null });
      assert.equal(file.isStream(), false);
    });
  });

  describe('isNull()', function() {
    it('returns false when the contents are a Buffer', function() {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert.equal(file.isNull(), false);
    });

    it('returns false when the contents are a Stream', function() {
      const val = from([]);
      const file = new File({ contents: val });
      assert.equal(file.isNull(), false);
    });

    it('returns true when the contents are null', function() {
      const file = new File({ contents: null });
      assert(file.isNull());
    });
  });

  describe('isDirectory()', function() {
    const fakeStat = { isDirectory: () => true };

    it('returns false when the contents are a Buffer', function() {
      const val = Buffer.from('test');
      const file = new File({ contents: val, stat: fakeStat });
      assert.equal(file.isDirectory(), false);
    });

    it('returns false when the contents are a Stream', function() {
      const val = from([]);
      const file = new File({ contents: val, stat: fakeStat });
      assert.equal(file.isDirectory(), false);
    });

    it('returns true when the contents are null & stat.isDirectory is true', function() {
      const file = new File({ contents: null, stat: fakeStat });
      assert(file.isDirectory());
    });

    it('returns false when stat exists but does not contain an isDirectory method', function() {
      const file = new File({ contents: null, stat: {} });
      assert.equal(file.isDirectory(), false);
    });

    it('returns false when stat does not exist', function() {
      const file = new File({ contents: null });
      assert.equal(file.isDirectory(), false);
    });
  });

  describe('isSymbolicLink()', function() {
    const fakeStat = { isSymbolicLink: () => true };

    it('returns false when the contents are a Buffer', function() {
      const val = Buffer.from('test');
      const file = new File({ contents: val, stat: fakeStat });
      assert.equal(file.isSymbolicLink(), false);
    });

    it('returns false when the contents are a Stream', function() {
      const val = from([]);
      const file = new File({ contents: val, stat: fakeStat });
      assert.equal(file.isSymbolicLink(), false);
    });

    it('returns true when the contents are null & stat.isSymbolicLink is true', function() {
      const file = new File({ contents: null, stat: fakeStat });
      assert(file.isSymbolicLink());
    });

    it('returns false when stat exists but does not contain an isSymbolicLink method', function() {
      const file = new File({ contents: null, stat: {} });
      assert.equal(file.isSymbolicLink(), false);
    });

    it('returns false when stat does not exist', function() {
      const file = new File({ contents: null });
      assert.equal(file.isSymbolicLink(), false);
    });
  });

  describe('clone()', function() {
    it('copies all attributes over with Buffer contents', function() {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: Buffer.from('test')
      };
      const file = new File(options);
      const file2 = file.clone();

      assert.notEqual(file2, file);
      assert.equal(file2.cwd, file.cwd);
      assert.equal(file2.base, file.base);
      assert.equal(file2.path, file.path);
      assert.notEqual(file2.contents, file.contents);
      assert.equal(file2.contents.toString('utf8'), file.contents.toString('utf8'));
    });

    it('assigns Buffer content reference when contents option is false', function() {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: Buffer.from('test')
      };
      const file = new File(options);

      const copy1 = file.clone({ contents: false });
      assert.deepEqual(copy1.contents, file.contents);

      const copy2 = file.clone();
      assert.notEqual(copy2.contents, file.contents);

      const copy3 = file.clone({ contents: 'invalid' });
      assert.notEqual(copy3.contents, file.contents);
    });

    it('copies all attributes over with Stream contents', function(cb) {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup'])
      });
      const file2 = file.clone();

      assert.notEqual(file2, file);
      assert.equal(file2.cwd, file.cwd);
      assert.equal(file2.base, file.base);
      assert.equal(file2.path, file.path);
      assert.notEqual(file2.contents, file.contents);

      let called = 0;
      let data = null;
      let data2 = null;

      function compare(err) {
        if (err) {
          cb(err);
          return;
        }

        if (++called === 2) {
          assert.notEqual(data, data2);
          assert.equal(data.toString('utf8'), data2.toString('utf8'));
          cb();
        }
      }

      pipe([
        file.contents,
        concat(function(d) {
          data = d;
        })
      ], compare);

      pipe([
        file2.contents,
        concat(function(d) {
          data2 = d;
        })
      ], compare);
    });

    it('does not start flowing until all clones flows (data)', function() {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup'])
      };
      const file = new File(options);
      const file2 = file.clone();
      let ends = 2;
      let data = '';
      let data2 = '';

      function compare() {
        if (--ends === 0) {
          assert.equal(data, data2);
        }
      }

      // Start flowing file2
      file2.contents.on('data', function(chunk) {
        data2 += chunk.toString('utf8');
      });

      process.nextTick(function() {
        // Nothing was written yet
        assert.equal(data, '');
        assert.equal(data2, '');

        // Starts flowing file
        file.contents.on('data', function(chunk) {
          data += chunk.toString('utf8');
        });
      });

      file2.contents.on('end', compare);
      file.contents.on('end', compare);
    });

    it('does not start flowing until all clones flows (readable)', function(cb) {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from(['wa', 'dup'])
      };
      const file = new File(options);
      const file2 = file.clone();

      let data2 = '';

      function compare(data) {
        assert.equal(data.toString('utf8'), data2);
      }

      // Start flowing file2
      file2.contents.on('readable', function() {
        let chunk;
        while ((chunk = this.read()) !== null) {
          data2 += chunk.toString();
        }
      });

      pipe([
        file.contents,
        concat(compare)
      ], cb);
    });

    it('copies all attributes over with null contents', function() {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      };
      const file = new File(options);
      const file2 = file.clone();

      assert.notEqual(file2, file);
      assert.equal(file2.cwd, file.cwd);
      assert.equal(file2.base, file.base);
      assert.equal(file2.path, file.path);
      assert(!file2.contents);
    });

    it('properly clones the `stat` property', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.js',
        contents: Buffer.from('test'),
        stat: fs.statSync(__filename)
      });

      const clone = file.clone();

      assert(clone.stat.isFile());
      assert(!clone.stat.isDirectory());
      assert(file.stat instanceof fs.Stats);
      assert(clone.stat instanceof fs.Stats);
    });

    it('properly clones the `history` property', function() {
      const options = {
        cwd: path.normalize('/'),
        base: path.normalize('/test/'),
        path: path.normalize('/test/test.js'),
        contents: Buffer.from('test')
      };

      const file = new File(options);
      const copy = file.clone();

      assert.equal(copy.history[0], options.path);
      copy.path = 'lol';
      assert.notEqual(file.path, copy.path);
    });

    it('copies custom properties', function() {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
        custom: { meta: {} }
      };

      const file = new File(options);
      const file2 = file.clone();

      assert.notEqual(file2, file);
      assert.equal(file2.cwd, file.cwd);
      assert.equal(file2.base, file.base);
      assert.equal(file2.path, file.path);
      assert(file2.custom !== file.custom);
      assert(file2.custom.meta !== file.custom.meta);
      assert.deepEqual(file2.custom.meta, file.custom.meta);
      assert.deepEqual(file2.custom, file.custom);
    });

    it('copies history', function() {
      const options = {
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      };
      const history = [
        path.normalize('/test/test.coffee'),
        path.normalize('/test/test.js'),
        path.normalize('/test/test-938di2s.js')
      ];

      const file = new File(options);
      file.path = history[1];
      file.path = history[2];

      const file2 = file.clone();

      assert.deepEqual(file2.history, history);
      assert.notEqual(file2.history, file.history);
      assert.equal(file2.path, history[2]);
    });

    it('supports deep & shallow copy of all attributes', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null,
        custom: { meta: {} }
      });

      const file2 = file.clone();
      assert(file2.custom !== file.custom);
      assert.deepEqual(file2.custom, file.custom);
      assert(file2.custom.met !== file.custom.meta);
      assert.deepEqual(file2.custom.meta, file.custom.meta);

      const file3 = file.clone(true);
      assert(file3.custom !== file.custom);
      assert.deepEqual(file3.custom, file.custom);
      assert(file3.custom.met !== file.custom.meta);
      assert.deepEqual(file3.custom.meta, file.custom.meta);

      const file4 = file.clone({ deep: true });
      assert(file4.custom !== file.custom);
      assert.deepEqual(file4.custom, file.custom);
      assert(file4.custom.met !== file.custom.meta);
      assert.deepEqual(file4.custom.meta, file.custom.meta);

      const file5 = file.clone(false);
      assert(file5.custom === file.custom);
      assert.deepEqual(file5.custom, file.custom);
      assert(file5.custom.meta === file.custom.meta);
      assert.deepEqual(file5.custom.meta, file.custom.meta);

      const file6 = file.clone({ deep: false });
      assert(file6.custom === file.custom);
      assert.deepEqual(file6.custom, file.custom);
      assert(file6.custom.meta === file.custom.meta);
      assert.deepEqual(file6.custom.meta, file.custom.meta);
    });

    it('supports inheritance', function() {
      class ExtendedFile extends File {
      }

      const file = new ExtendedFile();
      const file2 = file.clone();

      assert.notEqual(file2, file);
      assert.deepEqual(file2.constructor, ExtendedFile);
      assert(file2 instanceof ExtendedFile);
      assert(file2 instanceof File);
      assert(ExtendedFile.prototype.isPrototypeOf(file2));
      assert(File.prototype.isPrototypeOf(file2));
    });
  });

  describe('inspect()', function() {
    it('returns correct format when no contents and no path', function() {
      const file = new File();
      assert.equal(inspect(file), '<File >');
    });

    it('returns correct format when Buffer contents and no path', function() {
      const val = Buffer.from('test');
      const file = new File({ contents: val });
      assert.equal(inspect(file), '<File <Buffer 74 65 73 74>>');
    });

    it('returns correct format when Buffer contents and relative path', function() {
      const val = Buffer.from('test');
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: val
      });
      assert.equal(inspect(file), '<File "test.coffee" <Buffer 74 65 73 74>>');
    });

    it('returns correct format when Stream contents and relative path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: from([])
      });
      assert.equal(inspect(file), '<File "test.coffee" <ClassStream>>');
    });

    it('returns correct format when null contents and relative path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee',
        contents: null
      });
      assert.equal(inspect(file), '<File "test.coffee">');
    });
  });

  describe('contents get/set', function() {
    it('returns _contents', function() {
      const val = Buffer.from('test');
      const file = new File();
      file._contents = val;
      assert.equal(file.contents, val);
    });

    it('sets _contents', function() {
      const val = Buffer.from('test');
      const file = new File();
      file.contents = val;
      assert.equal(file._contents, val);
    });

    it('sets a Buffer', function() {
      const val = Buffer.from('test');
      const file = new File();
      file.contents = val;
      assert.equal(file.contents, val);
    });

    it('wraps Stream in Cloneable', function() {
      const val = from([]);
      const file = new File();
      file.contents = val;
      assert(File.isCloneable(file.contents));
    });

    it('does not double wrap a Cloneable', function() {
      const val = from([]);
      const clone = new Cloneable(val);
      const file = new File();
      file.contents = clone;
      assert.deepEqual(file.contents._original, val);
    });

    it('sets null', function() {
      const val = null;
      const file = new File();
      file.contents = val;
      assert.equal(file.contents, null);
    });

    it('does not set a string', function() {
      const file = new File();
      assert.throws(() => (file.contents = 'val'), /expected/);
    });
  });

  describe('cwd get/set', function() {
    it('returns _cwd', function() {
      const val = '/test';
      const file = new File();
      file._cwd = val;
      assert.equal(file.cwd, val);
    });

    it('sets _cwd', function() {
      const file = new File();
      const val = '/test';
      file.cwd = val;
      assert.equal(file._cwd, path.normalize(val));
    });

    it('normalizes and removes trailing separator on set', function() {
      const file = new File();
      file.cwd = '/test/foo/../foo/';
      assert.equal(file.cwd, '/test/foo');

      file.cwd = '\\test\\foo\\..\\foo\\';
      assert.equal(file.cwd, '/test/foo');
    });

    it('throws on set with invalid values', function() {
      const invalidValues = [
        '',
        null,
        undefined,
        true,
        false,
        0,
        Infinity,
        NaN,
        {},
        []
      ];

      const file = new File();
      invalidValues.forEach(function(val) {
        assert.throws(() => (file.cwd = val), /file\.cwd must be a non-empty string/);
      });
    });
  });

  describe('base get/set', function() {
    it('proxies cwd when omitted', function() {
      const file = new File({ cwd: '/test' });
      assert.equal(file.base, file.cwd);
    });

    it('proxies cwd when same', function() {
      const file = new File({
        cwd: '/test',
        base: '/test'
      });

      file.cwd = '/foo/';
      assert.equal(file.base, file.cwd);

      const file2 = new File({
        cwd: '/test'
      });
      file2.base = '/test/';
      file2.cwd = '/foo/';
      assert.equal(file2.base, file.cwd);
    });

    it('proxies to cwd when set to same value', function() {
      const file = new File({
        cwd: '/foo',
        base: '/bar'
      });
      assert.notEqual(file.base, file.cwd);
      file.base = file.cwd;
      assert.equal(file.base, file.cwd);
    });

    it('proxies to cwd when null or undefined', function() {
      const file = new File({
        cwd: '/foo',
        base: '/bar'
      });
      assert.notEqual(file.base, file.cwd);
      file.base = null;
      assert.equal(file.base, file.cwd);
      file.base = '/bar/';
      assert.notEqual(file.base, file.cwd);
      file.base = undefined;
      assert.equal(file.base, file.cwd);
    });

    it('should not normalize file._base', function() {
      const file = new File();
      file._base = '/test/';
      assert.equal(file.base, '/test/');
    });

    it('should normalize file.base when set', function() {
      const val = '/test/foo/';
      const file = new File();
      file.base = val;
      assert.equal(file._base, path.normalize(val.slice(0, -1)));
    });

    it('normalizes and removes trailing separator on set', function() {
      const val = '/test/foo/../foo/';
      const file = new File();

      file.base = val;

      assert.equal(file.base, '/test/foo');

      const val2 = '\\test\\foo\\..\\foo\\';
      file.base = val2;

      assert.equal(file.base, '/test/foo');
    });

    it('throws on set with invalid values', function() {
      const invalidValues = [
        true,
        false,
        1,
        0,
        Infinity,
        NaN,
        '',
        {},
        []
      ];
      const file = new File();

      invalidValues.forEach(function(val) {
        assert.throws(() => (file.base = val), /file\.base must be a non-empty string, null, or undefined/);
      });

    });
  });

  describe('relative get/set', function() {
    it('throws on set', function() {
      const file = new File();
      assert.throws(() => (file.relative = 'foo'));
    });

    it('throws on get with no path', function() {
      const file = new File();
      assert.throws(() => file.relative);
    });

    it('returns a relative path from base', function() {
      const file = new File({
        base: '/test/',
        path: '/test/test.coffee'
      });

      assert.equal(file.relative, 'test.coffee');
    });

    it('returns a relative path from cwd', function() {
      const file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });

      assert.equal(file.relative, path.normalize('test/test.coffee'));
    });

    it('does not append separator when directory', function() {
      const file = new File({
        base: '/test',
        path: '/test/foo/bar',
        stat: {
          isDirectory: function() {
            return true;
          }
        }
      });

      assert.equal(file.relative, path.normalize('foo/bar'));
    });

    it('does not append separator when symlink', function() {
      const file = new File({
        base: '/test',
        path: '/test/foo/bar',
        stat: {
          isSymbolicLink: function() {
            return true;
          }
        }
      });

      assert.equal(file.relative, path.normalize('foo/bar'));
    });

    it('does not append separator when directory & symlink', function() {
      const file = new File({
        base: '/test',
        path: '/test/foo/bar',
        stat: {
          isDirectory: function() {
            return true;
          },
          isSymbolicLink: function() {
            return true;
          }
        }
      });

      assert.equal(file.relative, path.normalize('foo/bar'));
    });
  });

  describe('dirname get/set', function() {
    it('throws on get with no path', function() {
      const file = new File();
      assert.throws(() => file.dirname);
    });

    it('returns the dirname without trailing separator', function() {
      const file = new File({
        cwd: '/',
        base: '/test',
        path: '/test/test.coffee'
      });

      assert.equal(file.dirname, path.normalize('/test'));
    });

    it('throws on set with no path', function() {
      const file = new File();
      assert.throws(() => (file.dirname = '/test'));
    });

    it('replaces the dirname of the path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });

      file.dirname = '/test/foo';
      assert.equal(file.path, path.normalize('/test/foo/test.coffee'));
    });
  });

  describe('basename get/set', function() {
    it('throws on get with no path', function() {
      const file = new File();
      assert.throws(() => file.basename);
    });

    it('returns the basename of the path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });

      assert.equal(file.basename, 'test.coffee');
    });

    it('does not append trailing separator when directory', function() {
      const file = new File({
        path: '/test/foo',
        stat: {
          isDirectory: function() {
            return true;
          }
        }
      });

      assert.equal(file.basename, 'foo');
    });

    it('does not append trailing separator when symlink', function() {
      const file = new File({
        path: '/test/foo',
        stat: {
          isSymbolicLink: function() {
            return true;
          }
        }
      });

      assert.equal(file.basename, 'foo');
    });

    it('does not append trailing separator when directory & symlink', function() {
      const file = new File({
        path: '/test/foo',
        stat: {
          isDirectory: function() {
            return true;
          },
          isSymbolicLink: function() {
            return true;
          }
        }
      });

      assert.equal(file.basename, 'foo');
    });

    it('removes trailing separator', function() {
      const file = new File({
        path: '/test/foo/'
      });

      assert.equal(file.basename, 'foo');
    });

    it('removes trailing separator when directory', function() {
      const file = new File({
        path: '/test/foo/',
        stat: {
          isDirectory: function() {
            return true;
          }
        }
      });

      assert.equal(file.basename, 'foo');
    });

    it('removes trailing separator when symlink', function() {
      const file = new File({
        path: '/test/foo/',
        stat: {
          isSymbolicLink: function() {
            return true;
          }
        }
      });

      assert.equal(file.basename, 'foo');
    });

    it('removes trailing separator when directory & symlink', function() {
      const file = new File({
        path: '/test/foo/',
        stat: {
          isDirectory: function() {
            return true;
          },
          isSymbolicLink: function() {
            return true;
          }
        }
      });

      assert.equal(file.basename, 'foo');
    });

    it('throws on set with no path', function() {
      const file = new File();
      assert.throws(() => (file.basename = 'foo.bar'));
    });

    it('replaces the basename of the path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });

      file.basename = 'foo.png';
      assert.equal(file.path, path.normalize('/test/foo.png'));
    });
  });

  describe('stem get/set', function() {
    it('throws on get with no path', function() {
      const file = new File();
      assert.throws(() => file.stem);
    });

    it('returns the stem of the path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });

      assert.equal(file.stem, 'test');
    });

    it('throws on set with no path', function() {
      const file = new File();
      assert.throws(() => (file.stem = 'foo'));
    });

    it('replaces the stem of the path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });

      file.stem = 'foo';
      assert.equal(file.path, path.normalize('/test/foo.coffee'));
    });
  });

  describe('extname get/set', function() {
    it('throws on get with no path', function() {
      const file = new File();
      assert.throws(() => file.extname);
    });

    it('returns the extname of the path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });

      assert.equal(file.extname, '.coffee');
    });

    it('throws on set with no path', function() {
      const file = new File();
      assert.throws(() => (file.extname = '.nada'));
    });

    it('replaces the extname of the path', function() {
      const file = new File({
        cwd: '/',
        base: '/test/',
        path: '/test/test.coffee'
      });

      file.extname = '.png';
      assert.equal(file.path, path.normalize('/test/test.png'));
    });
  });

  describe('path get/set', function() {
    it('records path in history upon instantiation', function() {
      const file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });
      const history = [
        path.normalize('/test/test.coffee')
      ];

      assert.equal(file.path, history[0]);
      assert.deepEqual(file.history, history);
    });

    it('records path in history when set', function() {
      const val = path.normalize('/test/test.js');
      const file = new File({
        cwd: '/',
        path: '/test/test.coffee'
      });
      const history = [
        path.normalize('/test/test.coffee'),
        val
      ];

      file.path = val;
      assert.equal(file.path, val);
      assert.deepEqual(file.history, history);

      const val2 = path.normalize('/test/test.es6');
      history.push(val2);

      file.path = val2;
      assert.equal(file.path, val2);
      assert.deepEqual(file.history, history);
    });

    it('does not record path in history when set to the current path', function() {
      const val = path.normalize('/test/test.coffee');
      const file = new File({
        cwd: '/',
        path: val
      });
      const history = [
        val
      ];

      file.path = val;
      file.path = val;
      assert.equal(file.path, val);
      assert.deepEqual(file.history, history);
    });

    it('does not record path in history when set to empty string', function() {
      const val = path.normalize('/test/test.coffee');
      const file = new File({
        cwd: '/',
        path: val
      });
      const history = [
        val
      ];

      file.path = '';
      assert.equal(file.path, val);
      assert.deepEqual(file.history, history);
    });

    it('throws on set with null path', function() {
      const file = new File();

      assert(!file.path);
      assert.deepEqual(file.history, []);

      assert.throws(() => (file.path = null));
    });

    it('normalizes the path upon set', function() {
      const val = '/test/foo/../test.coffee';
      const expected = path.normalize(val);
      const file = new File();

      file.path = val;

      assert.equal(file.path, expected);
      assert.deepEqual(file.history, [expected]);
    });

    it('removes the trailing separator upon set', function() {
      const file = new File();
      file.path = '/test/';

      assert.equal(file.path, path.normalize('/test'));
      assert.deepEqual(file.history, [path.normalize('/test')]);
    });

    it('removes the trailing separator upon set when directory', function() {
      const file = new File({
        stat: {
          isDirectory: function() {
            return true;
          }
        }
      });
      file.path = '/test/';

      assert.equal(file.path, path.normalize('/test'));
      assert.deepEqual(file.history, [path.normalize('/test')]);
    });

    it('removes the trailing separator upon set when symlink', function() {
      const file = new File({
        stat: {
          isSymbolicLink: function() {
            return true;
          }
        }
      });
      file.path = '/test/';

      assert.equal(file.path, path.normalize('/test'));
      assert.deepEqual(file.history, [path.normalize('/test')]);
    });

    it('removes the trailing separator upon set when directory & symlink', function() {
      const file = new File({
        stat: {
          isDirectory: function() {
            return true;
          },
          isSymbolicLink: function() {
            return true;
          }
        }
      });
      file.path = '/test/';

      assert.equal(file.path, path.normalize('/test'));
      assert.deepEqual(file.history, [path.normalize('/test')]);
    });
  });

  describe('symlink get/set', function() {
    it('return null on get with no symlink', function() {
      const file = new File();

      assert.equal(file.symlink, null);
    });

    it('returns _symlink', function() {
      const val = '/test/test.coffee';
      const file = new File();
      file._symlink = val;

      assert.equal(file.symlink, val);
    });

    it('throws on set with non-string', function() {
      const file = new File();
      assert.throws(() => (file.symlink = null));
    });

    it('sets _symlink', function() {
      const val = '/test/test.coffee';
      const expected = path.normalize(val);
      const file = new File();
      file.symlink = val;

      assert.equal(file._symlink, expected);
    });

    it('allows relative symlink', function() {
      const val = 'test.coffee';
      const file = new File();
      file.symlink = val;

      assert.equal(file.symlink, val);
    });

    it('normalizes and removes trailing separator upon set', function() {
      const val = '/test/foo/../bar/';
      const expected = path.normalize(val.slice(0, -1));
      const file = new File();
      file.symlink = val;

      assert.equal(file.symlink, expected);
    });
  });
});
