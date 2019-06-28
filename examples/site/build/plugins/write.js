'use strict';

const write = require('write');
const isValid = require('../utils/is-valid');

const plugin = options => app => {
  if (!isValid(app)) {
    throw new Error('expected an instance of Templates or Collection');
  }

  app.define('write', writeList(app, options));
  app.define('writeSync', writeListSync(app, options));

  if (app.collections) {
    return plugin(options);
  }
};

function writeList(app, options, name) {
  let opts = { ...app.options, ...options };
  if (opts.sync === true) {
    return writeListSync(app, options, name);
  }

  return (dest, list) => {
    if (!list && name) {
      if (!isValid.app(app)) throw new Error('expected an instance of Templates');
      list = app[name].list;
    }
    if (!list) {
      list = app.list;
    }

    let pending = [];
    let orig = dest;

    for (let file of list) {
      if (typeof orig === 'function') dest = orig(file.path);

      if (opts.render === false) {
        pending.push(write(file.path, file.contents));
        continue;
      }

      pending.push(app.render(file, { site: { paths: { root: dest } }})
        .then(file => {
          return write(file.path, file.contents);
        }));
    }

    return Promise.all(pending);
  };
}

function writeListSync(app, options = {}) {
  return (dest, list = app.list) => {
    let orig = dest;

    for (let file of list) {
      if (typeof orig === 'function') dest = orig(file.path);
      if (options.render !== false) {
        app.render(file, { site: { paths: { root: dest } }});
      }
      write.sync(file.path, file.contents);
    }
  };
}

module.exports = plugin;
