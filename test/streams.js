'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const vfs = require('vinyl-fs');
const Templates = require('..');
let app;

describe('streams', () => {
  beforeEach(() => {
    app = new Templates();

    app.create('pages');
    app.create('posts');

    app.pages.set('a.html', { contents: Buffer.from('...') });
    app.pages.set('b.html', { contents: Buffer.from('...') });
    app.pages.set('c.html', { contents: Buffer.from('...') });

    app.posts.set('x.html', { contents: Buffer.from('...') });
    app.posts.set('y.html', { contents: Buffer.from('...') });
    app.posts.set('z.html', { contents: Buffer.from('...') });
  });

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

  it('should return an input stream on a view collection', cb => {
    const files = [];
    app.toStream('pages')
      .on('error', cb)
      .on('data', file => files.push(file.path))
      .on('end', () => {
        assert.equal(files.length, 3);
        assert.equal(files[0], path.resolve('a.html'));
        assert.equal(files[1], path.resolve('b.html'));
        assert.equal(files[2], path.resolve('c.html'));
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
        assert.equal(files[0], path.resolve('x.html'));
        assert.equal(files[1], path.resolve('y.html'));
        assert.equal(files[2], path.resolve('z.html'));

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
        assert.equal(files[0], path.resolve('a.html'));
        assert.equal(files[1], path.resolve('b.html'));
        assert.equal(files[2], path.resolve('c.html'));
        cb();
      });
  });

  it('should run `app.onStream` and `app.pages.onStream` when using `app.toStream`', cb => {
    const files = [];
    const pages = [];
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
        assert.equal(files[0], path.resolve('a.html'));
        assert.equal(files[1], path.resolve('b.html'));
        assert.equal(files[2], path.resolve('c.html'));

        assert.equal(pages.length, 3);
        assert.equal(pages[0], path.resolve('a.html'));
        assert.equal(pages[1], path.resolve('b.html'));
        assert.equal(pages[2], path.resolve('c.html'));
        cb();
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
        assert.equal(files[0], path.resolve('a.html'));
        assert.equal(files[1], path.resolve('b.html'));
        assert.equal(files[2], path.resolve('c.html'));

        assert.equal(pages.length, 3);
        assert.equal(pages[0], path.resolve('a.html'));
        assert.equal(pages[1], path.resolve('b.html'));
        assert.equal(pages[2], path.resolve('c.html'));
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
        assert.equal(files[0], path.resolve('a.html'));
        assert.equal(files[1], path.resolve('b.html'));
        assert.equal(files[2], path.resolve('c.html'));
        cb();
      });
  });

  it('should add `toStream` to a view that is not on a collection', cb => {
    const view = app.view('foo.bar', { contents: Buffer.from('this is foo') });
    const files = [];

    view.toStream()
      .on('error', cb)
      .on('data', function(view) {
        files.push(view);
      })
      .on('end', () => {
        assert.equal(files.length, 1);
        assert.equal(files[0].path, path.resolve('foo.bar'));
        cb();
      });
  });

  it('should run onStream on a view that is not on a collection', cb => {
    const view = app.view('foo.bar', { contents: Buffer.from('this is foo') });
    const files = [];

    app.onStream(/\.bar$/, file => {
      files.push(file);
    });

    view.toStream()
      .on('error', cb)
      .on('data', function(view) {
        files.push(view);
      })
      .on('end', () => {
        assert.equal(files.length, 2);
        assert.equal(files[0].path, path.resolve('foo.bar'));
        assert.equal(files[1].path, path.resolve('foo.bar'));
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
        assert.equal(files[0], path.resolve('a.html'));
        assert.equal(files[1], path.resolve('b.html'));
        assert.equal(files[2], path.resolve('c.html'));
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
    app.toStream('pages', function(key, view) {
      return key !== 'a.html';
    })
      .on('error', cb)
      .on('data', file => files.push(file.path))
      .on('end', () => {
        assert.equal(files.length, 2);
        assert.equal(files[0], path.resolve('b.html'));
        assert.equal(files[1], path.resolve('c.html'));
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
        assert.equal(files[0], path.resolve('a.html'));
        assert.equal(files[1], path.resolve('c.html'));
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
        assert.equal(files[0], path.resolve('c.html'));
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
        assert.equal(files[0], path.resolve('c.html'));
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
        assert.equal(files[0], path.resolve('b.html'));
        assert.equal(files[1], path.resolve('y.html'));
        cb();
      });
  });

  it('should pipe an individual view into a stream', cb => {
    const files = [];
    app.pages.get('b.html')
      .toStream()
      .on('error', cb)
      .on('data', file => files.push(file.path))
      .on('end', () => {
        assert.equal(files.length, 1);
        assert.equal(files[0], path.resolve('b.html'));
        cb();
      });
  });

  it('should pipe multiple individual views into a stream', cb => {
    const files = [];
    app.pages.get('b.html').toStream()
      .pipe(app.posts.get('y.html').toStream())
      .on('error', cb)
      .on('data', file => files.push(file.path))
      .on('end', () => {
        assert.equal(files.length, 2);
        assert.equal(files[0], path.resolve('b.html'));
        assert.equal(files[1], path.resolve('y.html'));
        cb();
      });
  });

  it('should run app.onStream when using view.toStream', cb => {
    const files = [];
    app.onStream(/\.html/, file => {
      files.push(file.path);
    });

    app.pages.get('b.html').toStream()
      .on('error', cb)
      .on('data', () => {})
      .on('end', () => {
        assert.equal(files.length, 1);
        assert.equal(files[0], path.resolve('b.html'));
        cb();
      });
  });
});
