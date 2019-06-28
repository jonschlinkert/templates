'use strict';

const through = require('./through');

const toReadable = stream => {
  const output = through.obj();
  let piped = false;

  stream.pipe(output, { end: false });
  stream.once('error', err => output.emit('error', err));
  stream.once('end', () => piped !== true && output.end());

  output.setMaxListeners(0);
  output.once('pipe', src => (piped = true));
  return output;
};

const writeStream = (stream, files, fn) => {
  for (const [key, file] of files) {
    if (filter(key, file, fn)) {
      stream.write(file);
    }
  }
};

const filter = (key, file, val) => {
  if (Array.isArray(val)) {
    return val.some(ele => filter(key, file, ele));
  }
  if (typeof val === 'function') {
    return val(key, file);
  }
  if (typeof val === 'string') {
    return file.hasPath(val);
  }
  return true;
};

const handle = (app, method) => {
  return through.obj(async(file, enc, next) => {
    if (file.isNull()) {
      next(null, file);
      return;
    }
    app.handle && await app.handle(method, file);
    next(null, file);
  });
};

const outStream = (stream, instance) => {
  return toReadable(stream.pipe(handle(instance, 'onStream')));
};

/**
 * Push a file collection into a stream.
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

exports.app = (app, name, filter) => {
  const stream = through.obj();
  const collection = app[name];

  if (collection) {
    return exports.collection(collection, filter);
  }

  if (name && typeof name === 'string' && !app.has(name)) {
    stream.destroy(new Error(`invalid collection name: "${name}"`));
    return stream;
  }

  if (!name) {
    process.nextTick(stream.end.bind(stream));
    return toReadable(stream);
  }

  process.nextTick(() => {
    for (let file of app.files.values()) {
      writeStream(stream, file, name);
    }
    stream.end();
  });

  return outStream(stream, app);
};

/**
 * Push a file collection into a vinyl stream.
 *
 * ```js
 * app.posts.toStream(function(file) {
 *   return file.path !== 'index.hbs';
 * })
 * ````
 * @name collection.toStream
 * @param {Function} Optionally pass a filter function to use for filtering files.
 * @return {Stream}
 * @api public
 */

exports.collection = (collection, filter) => {
  let stream = through.obj();

  process.nextTick(() => {
    writeStream(stream, collection.files, filter);
    stream.end();
  });

  return outStream(stream, collection);
};

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

exports.file = (file, parent) => {
  const stream = through.obj();

  process.nextTick(() => {
    stream.write(file);
    stream.end();
  });

  return toReadable(stream.pipe(handle(parent, 'onLoad')).pipe(handle(parent, 'onStream')));
};
