'use strict';

var utils = require('./utils');

function copyProperties(receiver, provider, omit) {
  var props = Object.getOwnPropertyNames(provider);
  var keys = Object.keys(provider);
  var len = props.length, key;

  while (len--) {
    key = props[len];

    if (has(keys, key)) {
      receiver[key] = provider[key];
    } else if (!(key in receiver) && !has(omit, key)) {
      utils.copy(receiver, provider, key);
    }
  }
}

function inherit(receiver, provider) {
  if (!isObject(receiver)) {
    throw new TypeError('expected receiver to be an object.');
  }
  if (!isObject(provider)) {
    throw new TypeError('expected provider to be an object.');
  }

  var keys = [];
  for (var key in provider) {
    keys.push(key);
    receiver[key] = provider[key];
  }

  if (receiver.prototype && provider.prototype) {
    copyProperties(receiver.prototype, provider.prototype, keys);
    utils.define(receiver, '__super__', provider.prototype);
  }
}

function isObject(val) {
  return val && (typeof val === 'object' || typeof val === 'function');
}

function has(keys, key) {
  return keys.indexOf(key) > -1;
}

module.exports = inherit;
