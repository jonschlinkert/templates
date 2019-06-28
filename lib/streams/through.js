'use strict';

const { Transform } = require('stream');
const noop = (data, enc, next) => next(null, data);

const through = (options, transform, flush) => {
  if (typeof options === 'function') {
    flush = transform;
    transform = options;
    options = null;
  }

  if (!transform) {
    transform = noop;
  }

  if (transform.length === 2) {
    const fn = transform;
    transform = (data, enc, cb) => fn(data, cb);
  }

  const stream = new Transform({ transform, flush, ...options });
  stream.setMaxListeners(0);
  return stream;
};

through.obj = (options, transform, flush) => {
  if (typeof options === 'function') {
    flush = transform;
    transform = options;
    options = null;
  }

  const opts = Object.assign({ objectMode: true, highWaterMark: 16 }, options);
  return through(opts, transform, flush);
};

module.exports = through;
