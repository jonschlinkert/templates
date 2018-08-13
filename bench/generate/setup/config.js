'use strict';

const path = require('path');

module.exports = (options = {}) => {
  const opts = { ...options };
  const defaults = {
    paths: {
      cwd: path.join.bind(path, __dirname, '../src/content'),
      destBase: path.join.bind(path, __dirname, '../site/blog')
    }
  };

  if (opts.paths) {
    opts.paths = { ...defaults.paths, ...opts.paths };
  }

  return { ...defaults, ...opts };
};
