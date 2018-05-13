'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');
const mode = opts => opts.mode || 0o777 & ~process.umask();

/**
 * Create a directory and any intermediate directories.
 */

const mkdir = async(dirname, options = {}) => {
  assert.equal(typeof dirname, 'string', 'expected dirname to be a string');
  const opts = Object.assign({ cwd: process.cwd(), fs }, options);
  const segs = path.relative(opts.cwd, dirname).split(path.sep);
  const mkdirp = util.promisify(opts.fs.mkdir);
  const make = dir => mkdirp(dir, mode(opts)).catch(handleError(dirname, opts));
  for (let i = 0; i <= segs.length; i++) {
    await make((dirname = path.join(opts.cwd, ...segs.slice(0, i))));
  }
  return dirname;
};

/**
 * sync
 */

mkdir.sync = (dirname, options = {}) => {
  assert.equal(typeof dirname, 'string', 'expected dirname to be a string');
  const opts = Object.assign({ cwd: process.cwd(), fs }, options);
  const segs = path.relative(opts.cwd, dirname).split(path.sep);
  const make = dir => fs.mkdirSync(dir, mode(opts));
  for (let i = 0; i <= segs.length; i++) {
    try {
      make((dirname = path.join(opts.cwd, ...segs.slice(0, i))));
    } catch (err) {
      handleError(dirname, opts)(err);
    }
  }
  return dirname;
};

function handleError(dir, opts = {}) {
  return (err) => {
    if (err.code !== 'EEXIST' || path.dirname(dir) === dir || !opts.fs.statSync(dir).isDirectory()) {
      throw err;
    }
  };
}

module.exports = mkdir;
