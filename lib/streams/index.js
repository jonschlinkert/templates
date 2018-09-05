'use strict';

const { define } = require('../utils');
const through = require('./through');

function toStream(options) {
  const set = new Set();
  return function plugin(app) {
    if (!app) throw new Error('expected an app');
    if (app.collections) {
      if (set.has(app)) return;
      set.add(app);
      addMethod(app);
      define(app, 'toStream', appStream(app));
      app.on('file', toStream.file(options, app));
      return toStream.collection(options, app);
    }
    // return plugin;
  };
}

toStream.collection = (options, app) => {
  const set = new Set();

  return collection => {
    if (collection.isCollection) {
      if (set.has(collection)) return;
      set.add(collection);
      addMethod(collection);
      define(collection, 'toStream', collectionStream(collection));
      collection.on('file', toStream.file(options, app));
      return toStream.file(options, app);
    }
    return toStream;
  };
};

toStream.file = (options, app) => {
  const set = new Set();
  return file => {
    if (!isFile(file)) return;
    if (set.has(file)) return;
    set.add(file);
    define(file, 'toStream', fileStream(file, app));
  };
};

/**
 * Push a file collection into a vinyl stream.
 *
 * ```js
 * app.toStream('posts', function(file) {
 *   return file.path !== 'index.hbs';
 * })
 * ```
 * @name app.toStream
 * @param {String} `collection` Name of the collection to push into the stream.
 * @param {Function} Optionally pass a filter function to use for filtering files.
 * @return {Stream}
 * @api public
 */

function appStream(app) {
  return function(name, filter) {
    const stream = through.obj();

    if (!name) {
      process.nextTick(stream.end.bind(stream));
      return toReadable(stream);
    }

    const write = writeStream(stream);
    const collection = this[name];

    if (typeof name === 'string' && !this.has(name) && !collection) {
      stream.destroy(new Error(`invalid collection name: "${name}"`));
      return stream;
    }

    if (name && !collection) {
      process.nextTick(() => {
        for (const file of this.files.values()) {
          write(file, name);
        }
        stream.end();
      });
      return outStream(stream, this);
    }

    process.nextTick(() => {
      write(collection.files, filter);
      stream.end();
    });

    return outStream(stream, this);
  };
}

/**
 * Push a file collection into a vinyl stream.
 *
 * ```js
 * app.posts.toStream(function(file) {
 *   return file.path !== 'index.hbs';
 * })
 * ```

 * @name collection.toStream
 * @param {Function} Optionally pass a filter function to use for filtering files.
 * @return {Stream}
 * @api public
 */

function collectionStream(collection) {
  addMethod(collection);

  return function(filter) {
    const stream = through.obj();
    const write = writeStream(stream);

    process.nextTick(() => {
      write(this.files, filter);
      stream.end();
    });

    return outStream(stream, collection);
  };
}

/**
 * Push the current file into a vinyl stream.
 *
 * ```js
 * app.pages.getFile('a.html').toStream()
 *   .on('data', function(file) {
 *     console.log(file);
 *     //=> <Page "a.html" <Buffer 2e 2e 2e>>
 *   });
 * ```
 *
 * @name file.toStream
 * @return {Stream}
 * @api public
 */

function fileStream(file, app) {
  return function() {
    const stream = through.obj();

    process.nextTick(() => {
      stream.write(this);
      stream.end();
    });

    return toReadable(stream.pipe(handle(app, 'onLoad')).pipe(handle(app, 'onStream')));
  };
}

function addMethod(app) {
  if (typeof app.onStream !== 'function') {
    app.handler('onStream');
  }
}

function writeStream(stream) {
  return function(files, filterFn) {
    for (const [key, file] of files) {
      if (filter(key, file, filterFn)) {
        stream.write(file);
      }
    }
  };
}

function outStream(stream, instance) {
  return toReadable(stream.pipe(handle(instance, 'onStream')));
}

function handle(app, method) {
  return through.obj(async(file, enc, next) => {
    if (file.isNull()) {
      next(null, file);
      return;
    }
    if (app.handle) {
      await app.handle(method, file);
    }
    next(null, file);
  });
}

function toReadable(readable) {
  const output = through.obj();
  let piped = false;

  readable.pipe(output, { end: false });
  readable.once('error', err => output.emit('error', err));
  readable.once('end', () => {
    if (!piped) {
      output.end();
    }
  });

  output.setMaxListeners(0);
  output.once('pipe', src => (piped = true));
  return output;
}

function filter(key, file, val) {
  if (Array.isArray(val)) {
    for (const ele of val) {
      if (filter(key, file, ele)) {
        return true;
      }
    }
    return false;
  }
  if (typeof val === 'function') {
    return val(key, file);
  }
  if (typeof val === 'string') {
    return file.hasPath(val);
  }
  return true;
}

function isFile(val) {
  return val && typeof val === 'object' && val._isVinyl === true;
}

module.exports = toStream;
