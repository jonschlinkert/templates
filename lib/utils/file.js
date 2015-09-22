'use strict';

var fs = require('fs');
var path = require('path');
var name = require('./name');
var lazy = require('./lazy');

/**
 * Expose file utils
 */

var utils = module.exports;

/**
 * Resolve the absolute file paths for a glob of files.
 */

utils.resolveGlob = function resolveGlob(patterns, options) {
  var opts = lazy.extend({cwd: process.cwd()}, options);
  return lazy.globby.sync(patterns, opts).map(function (fp) {
    return path.resolve(opts.cwd, fp);
  });
};

/**
 * Try to read a file, fail gracefully
 */

utils.tryRead = function(fp) {
  try {
    return fs.readFileSync(fp);
  } catch(err) {}
  return null;
};

/**
 * Require a glob of files
 */

utils.requireGlob = function requireGlob(patterns, options) {
  return utils.resolveGlob(patterns, options)
    .reduce(function (acc, fp) {
      if (/\.(js(?:on)?)/.test(fp)) {
        var key = name.rename(fp, options);
        acc[key] = utils.tryRequire(fp);
      }
      return acc;
    }, {});
};

/**
 * Require a glob of data
 */

utils.requireData = function requireData(patterns, opts) {
  opts.rename = opts.namespace || opts.renameKey || function (key) {
    return path.basename(key, path.extname(key));
  };
  return utils.requireGlob(patterns, opts);
};

/**
 * Attempt to require a file. Fail silently.
 */

utils.tryRequire = function tryRequire(fp) {
  try {
    return require(fp);
  } catch(err) {}

  try {
    fp = path.resolve(fp);
    return require(fp);
  } catch(err) {}
  return null;
};
