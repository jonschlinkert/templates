'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const utils = require('../lib/utils');
const fixture = name => path.join(__dirname, 'fixtures', name);
const through = require('../lib/streams/through');
const Templates = require('..');
let app;

describe('utils', () => {
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
