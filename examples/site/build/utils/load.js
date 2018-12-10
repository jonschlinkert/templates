'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const readdir = util.promisify(fs.readdir);

const load = (collection, dirs = [], options, fn) => {
  if (options && options.sync) {
    return load.sync(collection, dirs, options, fn);
  }

  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  let result = [];
  let filter = (options && options.filter) || (file => true);
  let pending = [];

  let lookup = (cwd, dir) => {
    return readdir(dir)
      .then(async files => {
        for (let basename of files) {
          let filepath = path.join(dir, basename);
          let file = { path: filepath, cwd, dirname: dir, basename };
          file.stat = fs.lstatSync(file.path);
          if (file.stat.isSymbolicLink()) continue;
          if (await filter(file) === false) continue;
          if (options && options.recurse && file.stat.isDirectory()) {
            pending.push(lookup(cwd, file.path));
          } else {
            let verdict = await fn(file);
            if (verdict !== false) {
              result.push(await collection.set(file));
            }
          }
        }
      });
  };

  for (let cwd of [].concat(dirs || [])) {
    pending.push(lookup(cwd, cwd));
  }

  return Promise.all(pending).then(() => result);
};

load.sync = (collection, dirs = [], options, fn) => {
  if (typeof options === 'function') {
    fn = options;
    options = {};
  }

  let result = [];
  let filter = (options && options.filter) || (file => true);
  let lookup = (cwd, dir) => {
    let files = fs.readdirSync(dir);
    for (let basename of files) {
      let filepath = path.join(dir, basename);
      let file = { path: filepath, cwd, dirname: dir, basename };
      file.stat = fs.lstatSync(file.path);
      if (file.stat.isSymbolicLink()) continue;
      if (filter(file) === false) continue;
      if (options && options.recurse && file.stat.isDirectory()) {
        lookup(cwd, file.path);
      } else {
        let verdict = fn(file);
        if (verdict !== false) {
          result.push(collection.set(file));
        }
      }
    }
  };

  for (let cwd of [].concat(dirs || [])) lookup(cwd, cwd);
  return result;
};

module.exports = load;
