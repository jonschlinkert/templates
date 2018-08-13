'use strict';

const { define, through } = require('./utils');

const toStream = options => {
  let cache = new Set();
  return function plugin(app) {
    if (!app) throw new Error('expected an app');
    if (app.collections) {
      if (cache.has(app)) return;
      cache.add(app);
      addMethod(app);
      define(app, 'toStream', appStream(app));
      app.on('view', toStream.view(options, app));
      return toStream.collection(options, app);
    }
    return plugin;
  };
};

toStream.collection = (options, app) => {
  let cache = new Set();

  return collection => {
    if (collection.isCollection) {
      if (cache.has(collection)) return;
      cache.add(collection);
      addMethod(collection);
      define(collection, 'toStream', collectionStream(collection));
      collection.on('view', toStream.view(options, app));
      return toStream.view(options, app);
    }
    return toStream;
  };
};

toStream.view = (options, app) => {
  let cache = new Set();
  return view => {
    if (!isView(view)) return;
    if (cache.has(view)) return;
    cache.add(view);
    define(view, 'toStream', viewStream(view, app));
  };
};

/**
 * Push a view collection into a vinyl stream.
 *
 * ```js
 * app.toStream('posts', function(file) {
 *   return file.path !== 'index.hbs';
 * })
 * ```
 * @name app.toStream
 * @param {String} `collection` Name of the collection to push into the stream.
 * @param {Function} Optionally pass a filter function to use for filtering views.
 * @return {Stream}
 * @api public
 */

const appStream = app => {
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
        for (const view of this.views.values()) {
          write(view, name);
        }
        stream.end();
      });
      return outStream(stream, this);
    }

    process.nextTick(() => {
      write(collection.views, filter);
      stream.end();
    });

    return outStream(stream, this);
  };
};

/**
 * Push a view collection into a vinyl stream.
 *
 * ```js
 * app.posts.toStream(function(file) {
 *   return file.path !== 'index.hbs';
 * })
 * ```

 * @name collection.toStream
 * @param {Function} Optionally pass a filter function to use for filtering views.
 * @return {Stream}
 * @api public
 */

const collectionStream = collection => {
  return function(filter) {
    let stream = through.obj();
    let write = writeStream(stream);

    process.nextTick(() => {
      write(this.views, filter);
      stream.end();
    });

    return outStream(stream, collection);
  };
};

/**
 * Push the current view into a vinyl stream.
 *
 * ```js
 * app.pages.getView('a.html').toStream()
 *   .on('data', function(file) {
 *     console.log(file);
 *     //=> <Page "a.html" <Buffer 2e 2e 2e>>
 *   });
 * ```
 *
 * @name view.toStream
 * @return {Stream}
 * @api public
 */

const viewStream = (view, app) => {
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
  return (views, filterFn) => {
    for (let [key, view] of views) {
      if (filter(key, view, filterFn)) {
        stream.write(view);
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

function filter(key, view, val) {
  if (Array.isArray(val)) {
    for (const ele of val) {
      if (filter(key, view, ele)) {
        return true;
      }
    }
    return false;
  }
  if (typeof val === 'function') {
    return val(key, view);
  }
  if (typeof val === 'string') {
    return view.hasPath(val);
  }
  return true;
}

function isView(val) {
  return val && typeof val === 'object' && val._isVinyl === true;
}

module.exports = toStream;