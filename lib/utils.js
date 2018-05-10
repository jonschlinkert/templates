'use strict';

const { Transform } = require('stream');
const typeOf = require('kind-of');
const noop = (data, enc, cb) => cb(null, data);

exports.dot = str => (str && str[0] === '.') ? str.slice(1) : str;
exports.isString = val => typeof val === 'string';
exports.isBuffer = val => typeOf(val) === 'buffer';
exports.isObject = val => typeOf(val) === 'object';
exports.isStream = val => exports.isObject(val) && typeof val.pipe === 'function';

exports.isBuffer = val => {
  return val && typeof val === 'object' && val.constructor && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
};

exports.shouldRender = (app, view, locals, options) => {

};

define(exports, 'typeOf', () => require('kind-of'));
// define(exports, 'layouts', () => require('layouts'));
define(exports, 'Router', () => require('en-route'));

function define(obj, key, fn) {
  Reflect.defineProperty(obj, key, { get: fn });
}

exports.define = function(obj, key, val) {
  Reflect.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable: true,
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
