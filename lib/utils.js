'use strict';

define(exports, 'typeOf', () => require('kind-of'));
define(exports, 'layouts', () => require('layouts'));
define(exports, 'Router', () => require('en-route'));
define(exports, 'endsWith', () => require('path-ends-with'));

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
