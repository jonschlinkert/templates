'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const utils = require('../lib/utils');
const File = require('../lib/file');
const fixture = name => path.join(__dirname, 'fixtures', name);
const through = require('../lib/streams/through');
const Templates = require('..');
let app;

describe('utils', () => {
  describe('.typeOf', () => {
    it('should return the typeof value', () => {
      assert.equal(utils.typeOf('foo'), 'string');
      assert.equal(utils.typeOf(Buffer.from('foo')), 'buffer');
      assert.equal(utils.typeOf(2), 'number');
      assert.equal(utils.typeOf(new Map()), 'map');
      assert.equal(utils.typeOf(new Set()), 'set');
      assert.equal(utils.typeOf(new RegExp('foo')), 'regexp');
      assert.equal(utils.typeOf(new Date()), 'date');
      assert.equal(utils.typeOf(new Error('foo')), 'error');
      assert.equal(utils.typeOf(Promise.resolve(null)), 'promise');
    });
  });

  describe('.isBinary', () => {
    it('should be true when the given value is binary', () => {
      assert(utils.isBinary(fs.readFileSync(fixture('octdrey-catburn.jpg'))));
      assert(utils.isBinary(fs.readFileSync(fixture('octocat.png'))));
    });

    it('should be false when the given value is not binary', () => {
      assert(!utils.isBinary());
      assert(!utils.isBinary('foo'));
      assert(!utils.isBinary(Buffer.from('foo')));
      assert(!utils.isBinary(null));
    });
  });

  describe('.isBinaryFile', () => {
    it('should be true when a file has binary contents', () => {
      assert(utils.isBinaryFile(new File({ contents: fs.readFileSync(fixture('octdrey-catburn.jpg')) })));
      assert(utils.isBinaryFile(new File({ contents: fs.readFileSync(fixture('octocat.png')) })));
    });

    it('should use file.extname', () => {
      assert(!utils.isBinaryFile(new File({ path: 'foo' })));
      assert(utils.isBinaryFile(new File({ path: 'foo.png' })));
      assert(!utils.isBinaryFile(new File({ path: 'foo.hbs' })));
    });

    it('should add ._isBinary flag to file', () => {
      let file = new File({ path: 'foo' });
      utils.isBinaryFile(file);
      utils.isBinaryFile(file);
      assert.strictEqual(file._isBinary, false);
      let file2 =new File({ path: 'foo.png' });
      utils.isBinaryFile(file2);
      assert.strictEqual(file2._isBinary, true);
      let file3 = new File({ path: 'foo.hbs' });
      utils.isBinaryFile(file3);
      assert.strictEqual(file3._isBinary, false);
    });

    it('should be false when the given value is not binary', () => {
      assert(!utils.isBinaryFile(new File({ contents: 'foo' })));
      assert(!utils.isBinaryFile(new File({ contents: Buffer.from('foo') })));
      assert(!utils.isBinaryFile(new File({ contents: null })));
    });
  });

  describe('.set', () => {
    it('should set a value', () => {
      let obj = {};
      utils.set(obj, 'foo', 'bar');
      assert.equal(obj.foo, 'bar');
    });

    it('should set a nested value', () => {
      let obj = {};
      utils.set(obj, 'foo.bar', 'baz');
      assert.equal(obj.foo.bar, 'baz');
    });
  });

  describe('.get', () => {
    it('should get a value', () => {
      let obj = {};
      utils.set(obj, 'foo', 'bar');
      assert.equal(utils.get(obj, 'foo'), 'bar');
    });

    it('should get a nested value', () => {
      let obj = {};
      utils.set(obj, 'foo.bar', 'baz');
      assert.equal(utils.get(obj, 'foo.bar'), 'baz');
    });
  });

  describe('.endsWith', () => {
    it('should be true when a path ends with the given value', () => {
      assert(utils.endsWith('foo/bar/baz', 'baz'));
      assert(utils.endsWith('foo/bar/baz', '/baz'));
      assert(utils.endsWith('foo/bar/baz', 'bar/baz'));
      assert(utils.endsWith('foo/bar/baz', 'foo/bar/baz'));
      assert(utils.endsWith('/foo/bar/baz', 'foo/bar/baz'));
    });

    it('should be case sensitive when options.nocase is false', () => {
      assert(!utils.endsWith('foo/bar/baz', 'BAZ', { nocase: false }));
      assert(!utils.endsWith('foo/bar/baz', '/BAZ', { nocase: false }));
      assert(!utils.endsWith('foo/bar/baz', 'bar/BAZ', { nocase: false }));
      assert(!utils.endsWith('foo/bar/baz', 'foo/bar/BAZ', { nocase: false }));
      assert(!utils.endsWith('/foo/bar/baz', 'foo/bar/BAZ', { nocase: false }));
    });

    it('should be false when a path does not end with the given value', () => {
      assert(!utils.endsWith());
      assert(!utils.endsWith('foo'));
      assert(!utils.endsWith(null, 'foo'));
      assert(!utils.endsWith('foo/bar/baz', 'qux'));
      assert(!utils.endsWith('foo/bar/baz', '/qux'));
      assert(!utils.endsWith('foo/bar/baz', 'bar/qux'));
      assert(!utils.endsWith('foo/bar/baz', 'foo/bar/qux'));
      assert(!utils.endsWith('/foo/bar/baz', 'foo/bar/qux'));
    });
  });

  describe('.through', () => {
    beforeEach(() => {
      app = new Templates({ streams: true });
      app.create('pages');
      app.pages.set('a.html', { contents: Buffer.from('...') });
    });

    it('should allow enc argument to be omitted', cb => {
      app.toStream('pages')
        .pipe(through.obj((file, next) => {
          file.foo = 'bar';
          next(null, file);
        }))
        .on('data', file => {
          assert.equal(file.foo, 'bar');
        })
        .on('error', cb)
        .on('end', cb);
    });

    it('should support flush function', cb => {
      const files = [];
      app.toStream('pages')
        .pipe(through.obj((file, enc, next) => {
          file.foo = 'bar';
          files.push(file);
          next();
        }, function(cb) {
          this.push(files[0]);
          cb();
        }))
        .on('error', cb)
        .on('data', file => {})
        .on('end', () => {
          assert.equal(files[0].foo, 'bar');
          cb();
        });
    });
  });
});
