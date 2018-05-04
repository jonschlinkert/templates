'use strict';

const { Transform } = require('stream');
const typeOf = require('kind-of');
const noop = (data, enc, cb) => cb(null, data);

exports.isString = val => typeof val === 'string';
exports.isBuffer = val => typeOf(val) === 'buffer';
exports.isObject = val => typeOf(val) === 'object';
exports.isStream = val => exports.isObject(val) && typeof val.pipe === 'function';

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
    const fn = transform;
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
  return exports.through(opts, transform, flush);
};
