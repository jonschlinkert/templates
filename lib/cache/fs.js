'use strict';

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var define = require('define-property');
var utils = require('../utils');

function File(filepath) {
  this.path = filepath;
  this.read = function (force) {
    if (!this.contents || force) {
      console.log('reading contents');
      this.contents = utils.tryRead(this.path);
    }
  };
  define(this, 'stat', {
    get: function () {
      if (!this._stat) {
        console.log('getting stats');
        define(this, '_stat', fs.statSync(this.path));
      }
      return this._stat;
    }
  });
  return this;
}

/**
 * Create a new `Cache`, optionally passing an object of
 * `files` to initialize with.
 *
 * @param {Object} `files`
 * @api public
 */

var Cache = module.exports = function Cache(files) {
  this.files = files || {};
};

/**
 * Create a file object from a filepath.
 *
 * @param {String} `filepath`
 * @api public
 */

Cache.prototype.file = function (filepath) {
  return new File(filepath);
};

/**
 * Set file by the given filepath.
 *
 * @param {String} `filepath`
 * @api private
 */

Cache.prototype.set = function (filepath) {
  this.files[filepath] = (this.files[filepath] || this.file(filepath));
  return this;
};

/**
 * Get a cached file by `filepath`
 *
 * @param {String} `filepath`
 * @api public
 */

Cache.prototype.get = function (filepath) {
  return this.files[filepath];
};


var cache = new Cache();

cache.set('index.js');
cache.set('index.js');
cache.set('index.js');
cache.set('index.js');

var file = cache.get('index.js');
file.read();
file.read();
file.read();
file.read();
file.read();

console.log(file.stat);
console.log(file.stat);
console.log(file.stat);
console.log(file.stat);
console.log(file);
