'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const interpolate = require('./interpolate');

/**
 * Engine for processing ES Template Literals
 */

module.exports = (config = {}) => {
  const registered = Symbol('registered');
  const registerPartials = config.registerPartials !== false;
  const opts = { cwd: process.cwd(), ...config };
  const readfile = util.promisify(fs.readFile);
  const partials = {};

  const helpers = {
    read(name) {
      return readfile(path.resolve(opts.cwd, name), 'utf8');
    },
    readSync(name) {
      return fs.readFileSync(path.resolve(opts.cwd, name), 'utf8');
    },
    log(...args) {
      console.log(...args);
      return '';
    },
    partial(name, locals) {
      return this.render(partials[name], locals);
    },
    include(name, locals) {
      return this.render(helpers.readSync(name), locals);
    }
  };

  const registerHelper = (name, fn) => {
    if (typeof name !== 'string') {
      for (let key of Object.keys(name)) registerHelper(key, name[key]);
    } else {
      helpers[name] = fn;
    }
  };

  const registerPartial = (name, partial) => {
    if (typeof name !== 'string') {
      for (let key of Object.keys(name)) registerPartial(key, name[key]);
    } else {
      partials[name] = partial;
    }
  };

  const register = (app, options = {}) => {
    if (!app) app = {};
    if (!app.cache) app.cache = {};

    if (options.helpers) {
      registerHelper(options.helpers);
    }

    if (options.partials) {
      registerPartial(options.partials);
    }

    if (registerPartials && app.cache.partials && !app[registered]) {
      app[registered] = true;
      registerPartial(app.cache.partials);
    }
  };

  const engine = {
    name: 'literal',
    helpers,
    async compile(file, options = {}) {
      if (typeof file === 'string') file = { contents: Buffer.from(file) };
      let opts = { ...config, ...options };

      if (typeof file.fn !== 'function' || opts.recompile === true) {
        let thisArg = this === engine ? { cache: {}, ids: new Map() } : this;
        let imports = { ...helpers, ...options.helpers, ...options.imports };
        file.fn = await interpolate.compile(file.contents.toString(), imports, thisArg);
      }

      if (registerPartials && file.type === 'partial') {
        registerPartial(file.key, file.fn);
      }
      return file;
    },

    compileSync(file, options) {
      if (typeof file === 'string') file = { contents: Buffer.from(file) };
      let opts = { ...config, ...options };

      if (typeof file.fn !== 'function' || opts.recompile === true) {
        let thisArg = this === engine ? { cache: {}, ids: new Map() } : this;
        let imports = { ...helpers, ...options.helpers, ...options.imports };
        file.fn = interpolate.compileSync(file.contents.toString(), imports, thisArg);
      }

      if (registerPartials && file.type === 'partial') {
        registerPartial(file.key, file.fn);
      }
      return file;
    },

    async render(file, locals, options) {
      if (typeof file === 'string') file = { contents: Buffer.from(file) };

      let thisArg = this === engine ? { cache: {}, ids: new Map() } : this;
      let opts = { ...locals, ...options };
      register(thisArg, opts);

      if (typeof file.fn !== 'function' || opts.recompile === true) {
        await engine.compile.call(this, file, opts);
      }

      let data = { ...locals, ...file.data };
      data.file = file;
      data.app = this;

      let res = await file.fn(data);
      let str = this.resolveIds ? await this.resolveIds(res) : res;
      file.contents = Buffer.from(str);
      return file;
    },

    renderSync(file, locals, options) {
      if (typeof file === 'string') file = { contents: Buffer.from(file) };

      let thisArg = this === engine ? { cache: {}, ids: new Map() } : this;
      let opts = { ...locals, ...options };
      register(thisArg, opts);

      if (typeof file.fn !== 'function' || opts.recompile === true) {
        engine.compileSync.call(this, file, opts);
      }

      let data = { ...locals, ...file.data };
      data.file = file;
      data.app = this;

      file.contents = Buffer.from(file.fn(data));
      return file;
    }
  };

  return engine;
};
