'use strict';

const load = require('../utils/load');
const isValid = require('../utils/is-valid');

const plugin = options => app => {
  if (!isValid(app)) {
    throw new Error('expected an instance of Templates or Collection');
  }

  let defaults = { recurse: true, ...app.options };

  if (!defaults.filter) {
    defaults.filter = file => !/node_modules/.test(file.path);
  }

  app.define('load', (cwd, fn) => {
    return load(app, cwd, { ...defaults, ...options }, fn);
  });

  app.define('loadSync', (cwd, fn) => {
    return load.sync(app, cwd, { ...defaults, ...options }, fn);
  });

  if (app.collections) {
    return plugin(options);
  }
};

module.exports = plugin;
