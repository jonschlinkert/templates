'use strict';

require('mocha');
const path = require('path');
const assert = require('assert').strict;
const vfs = require('vinyl-fs');
const App = require('..');
let app;

describe('streams', () => {
  beforeEach(() => {
    app = new App({ streams: true });

    app.create('pages');
    app.create('posts');

    app.pages.set('a.html', { contents: Buffer.from('...') });
    app.pages.set('b.html', { contents: Buffer.from('...') });
    app.pages.set('c.html', { contents: Buffer.from('...') });

    app.posts.set('x.html', { contents: Buffer.from('...') });
    app.posts.set('y.html', { contents: Buffer.from('...') });
    app.posts.set('z.html', { contents: Buffer.from('...') });
  });

  describe('app', () => {
    it('should return add the `toStream` method to the instance', cb => {
      assert(app.toStream);
      assert.equal(typeof app.toStream, 'function');
      cb();
    });

    it('should return a through stream', cb => {
      app.toStream()
        .on('data', () => {})
        .on('end', cb);
    });

    it('should return an input stream on a file collection', cb => {
      const files = [];
      app.toStream('pages')
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 3);
          assert.equal(files[0], 'a.html');
          assert.equal(files[1], 'b.html');
          assert.equal(files[2], 'c.html');
          cb();
        });
    });

    it('should throw an error if collection name does not exist', cb => {
      app.toStream('lslslslsllslsllsl')
        .on('error', err => {
          assert(/invalid collection name/.test(err.message));
          cb();
        });
    });

    it('should stack multiple collections', cb => {
      const files = [];
      app.toStream('pages')
        .on('error', cb)
        .pipe(app.toStream('posts'))
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 6);
          cb();
        });
    });

    it('should work with `.src`', cb => {
      const files = [];
      vfs.src('fixtures/*.txt', { cwd: __dirname })
        .pipe(app.toStream('posts'))
        .on('data', file => files.push(file.path))
        .on('error', cb)
        .on('end', () => {
          assert.equal(files.length, 6);
          assert.equal(files[0], 'x.html');
          assert.equal(files[1], 'y.html');
          assert.equal(files[2], 'z.html');

          assert.equal(path.basename(files[3]), 'a.txt');
          assert.equal(path.basename(files[4]), 'b.txt');
          assert.equal(path.basename(files[5]), 'c.txt');
          cb();
        });
    });

    it('should run `app.onStream` when using `app.toStream`', cb => {
      const files = [];
      app.onStream(/\.html/, async file => {
        files.push(file.path);
      });

      app.toStream('pages')
        .on('error', cb)
        .on('data', () => {})
        .on('end', () => {
          assert.equal(files.length, 3);
          assert.equal(files[0], 'a.html');
          assert.equal(files[1], 'b.html');
          assert.equal(files[2], 'c.html');
          cb();
        });
    });
  });

  describe('collections', () => {
    it('should run `app.onStream` and `app.pages.onStream` middleware', cb => {
      const files = [];
      const pages = [];
      const actual = [];

      app.onStream(/\.html/, file => {
        files.push(file.path);
      });

      app.pages.onStream(/\.html/, file => {
        pages.push(file.path);
      });

      app.toStream('pages')
        .on('error', cb)
        .on('data', () => {})
        .on('end', () => {
          assert.equal(files.length, 3);
          assert.equal(files[0], 'a.html');
          assert.equal(files[1], 'b.html');
          assert.equal(files[2], 'c.html');

          assert.equal(pages.length, 3);
          assert.equal(pages[0], 'a.html');
          assert.equal(pages[1], 'b.html');
          assert.equal(pages[2], 'c.html');
          cb();
        });
    });

    it('should run app middleware before collection middleware', () => {
      const middleware = [];

      app.onStream(/\.html/, file => {
        middleware.push('app');
      });

      app.pages.onStream(/\.html/, file => {
        middleware.push('collection');
      });

      return app.toStream('pages')
        .on('end', () => {
          assert.deepEqual(middleware, ['app', 'collection', 'app', 'collection', 'app', 'collection']);
        });
    });

    it('should emit `app.onStream` and `app.pages.onStream` when using `app.pages.toStream`', cb => {

      const files = [];
      const pages = [];

      app.onStream(/\.html/, file => {
        files.push(file.path);
      });

      app.pages.onStream(/\.html/, file => {
        pages.push(file.path);
      });

      app.pages.toStream()
        .on('error', cb)
        .on('data', () => {})
        .on('end', () => {
          assert.equal(files.length, 3);
          assert.equal(files[0], 'a.html');
          assert.equal(files[1], 'b.html');
          assert.equal(files[2], 'c.html');

          assert.equal(pages.length, 3);
          assert.equal(pages[0], 'a.html');
          assert.equal(pages[1], 'b.html');
          assert.equal(pages[2], 'c.html');
          cb();
        });
    });

    it('should pipe a collection', cb => {
      const files = [];
      app.pages.toStream()
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 3);
          assert.equal(files[0], 'a.html');
          assert.equal(files[1], 'b.html');
          assert.equal(files[2], 'c.html');
          cb();
        });
    });

    it('should add `toStream` to a file that is not on a collection', cb => {
      const file = app.file('foo.bar', { contents: Buffer.from('this is foo') });
      const files = [];

      file.toStream(app)
        .on('error', cb)
        .on('data', file => {
          files.push(file);
        })
        .on('end', () => {
          assert.equal(files.length, 1);
          assert.equal(files[0].path, 'foo.bar');
          cb();
        });
    });

    it('should run onStream on a file that is not on a collection', cb => {
      const file = app.file('foo.bar', { contents: Buffer.from('this is foo') });
      const files = [];

      app.onStream(/\.bar$/, file => {
        files.push(file);
      });

      file.toStream()
        .on('error', cb)
        .on('data', file => {
          files.push(file);
        })
        .on('end', () => {
          assert.equal(files.length, 2);
          assert.equal(files[0].path, 'foo.bar');
          assert.equal(files[1].path, 'foo.bar');
          cb();
        });
    });

    it('should emit `app.onStream` when using `app.pages.toStream`', cb => {
      const files = [];

      app.onStream(/\.html$/, file => {
        files.push(file.path);
      });

      app.pages.toStream()
        .on('error', cb)
        .on('data', () => {})
        .on('end', () => {
          assert.equal(files.length, 3);
          assert.equal(files[0], 'a.html');
          assert.equal(files[1], 'b.html');
          assert.equal(files[2], 'c.html');
          cb();
        });
    });

    it('should pipe from one collection to another', cb => {
      const files = [];
      app.pages.toStream()
        .pipe(app.posts.toStream())
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 6);
          cb();
        });
    });

    it('should support an optional filter function as the second argument', cb => {
      const files = [];
      app.toStream('pages', (key, file) => {
          return key !== 'a.html';
        })
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 2);
          assert.equal(files[0], 'b.html');
          assert.equal(files[1], 'c.html');
          cb();
        });
    });

    it('should support an array as the second argument', cb => {
      const files = [];
      app.toStream('pages', ['a.html', 'c.html'])
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 2);
          assert.equal(files[0], 'a.html');
          assert.equal(files[1], 'c.html');
          cb();
        });
    });

    it('should support a string as the second argument', cb => {
      const files = [];
      app.toStream('pages', 'c.html')
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 1);
          assert.equal(files[0], 'c.html');
          cb();
        });
    });

    it('should support matching a file path on any collection', cb => {
      const files = [];

      app.toStream('c.html')
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 1);
          assert.equal(files[0], 'c.html');
          cb();
        });
    });

    it('should support an array of files on any collection', cb => {
      const files = [];
      app.toStream(['b.html', 'y.html'])
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 2);
          assert.equal(files[0], 'b.html');
          assert.equal(files[1], 'y.html');
          cb();
        });
    });

    it('should pipe an individual file into a stream', cb => {
      const files = [];
      app.pages.get('b.html')
        .toStream()
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 1);
          assert.equal(files[0], 'b.html');
          cb();
        });
    });

    it('should pipe multiple individual files into a stream', cb => {
      const files = [];
      app.pages.get('b.html').toStream()
        .pipe(app.posts.get('y.html').toStream())
        .on('error', cb)
        .on('data', file => files.push(file.path))
        .on('end', () => {
          assert.equal(files.length, 2);
          assert.equal(files[0], 'b.html');
          assert.equal(files[1], 'y.html');
          cb();
        });
    });

    it('should run app.onStream when using file.toStream', cb => {
      const files = [];
      app.onStream(/\.html/, file => {
        files.push(file.path);
      });

      app.pages.get('b.html').toStream()
        .on('error', cb)
        .on('data', () => {})
        .on('end', () => {
          assert.equal(files.length, 1);
          assert.equal(files[0], 'b.html');
          cb();
        });
    });
  });
});
