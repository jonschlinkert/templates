'use strict';

const { Transform } = require('stream');
const noop = (data, enc, cb) => cb(null, data);

define(exports, 'typeOf', () => require('kind-of'));
define(exports, 'layouts', () => require('layouts'));
define(exports, 'Router', () => require('en-route'));

function define(obj, key, fn) {
  Reflect.defineProperty(obj, key, { get: fn });
}

exports.define = function(app, key, val) {
  Reflect.defineProperty(app, key, {
    writable: true,
    configurable: true,
    enumerable: false,
    value: val
  });
};

exports.through = (options, transform = noop, flush) => {
  if (typeof options === 'function') {
    flush = transform;
    transform = options;
    options = null;
  }

  if (transform.length === 2) {
    transform = (data, enc, cb) => fn(data, cb);
  }

  return new Transform({ transform, flush, ...options });
};

exports.through.obj = (options, transform, flush) => {
  if (typeof options === 'function') {
    flush = transform;
    transform = options;
    options = null;
  }

  const opts = Object.assign({ objectMode: true, highWaterMark: 16 }, options);
  return through(opts, transform, flush);
};
