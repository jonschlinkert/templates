'use strict';

/**
 * Handlebars engine
 */

module.exports = instance => {
  if (instance === void 0) throw new Error('expected an instance of "handlebars"');
  const registered = Symbol('registered');

  const register = (app, options = {}) => {
    if (options.helpers) {
      instance.registerHelper(options.helpers);
    }

    if (options.partials) {
      instance.registerPartial(options.partials);
    }

    if (options.registerPartials === false) return;
    if (!instance[registered] && app.cache.partials) {
      instance[registered] = true;
      instance.registerPartial(app.cache.partials);
    }
  };

  /**
   * Engine
   */

  const engine = {
    name: 'handlebars',
    instance,
    compile(file, options) {
      return engine.compileSync(file, options);
    },
    compileSync(file, options = {}) {
      const { recompile, registerPartials } = options;

      if (typeof file.fn !== 'function' || recompile === true) {
        file.fn = instance.compile(file.contents.toString(), options);
      }

      if (registerPartials === false) return file;
      if (file.kind === 'partial' && !instance.partials[file.key]) {
        instance.registerPartial(file.key, file.fn);
      }
      return file;
    },

    async render(file, locals, options) {
      register(this, options);

      // resolve dynamic partials
      if (options && options.asyncHelpers === true) {
        const resolvePartial = instance.VM.resolvePartial.bind(instance.VM);
        instance.VM.resolvePartial = (name, context, options) => {
          const tok = this.ids.get(name);
          if (tok) {
            const opts = tok.options || {};
            const args = tok.args.concat(opts);
            name = tok.fn(...args);
          }
          return resolvePartial(name, context, options);
        };
      }

      const data = Object.assign({}, locals, file.data);
      data.file = file;
      data.app = this;

      if (!file.fn) await this.compile(file, options);
      const res = await file.fn(data);
      const str = await this.resolveIds(res);
      file.contents = Buffer.from(str);
      return file;
    },

    renderSync(file, locals, options) {
      register(this, options);

      const data = Object.assign({}, locals, file.data);
      data.file = file;
      data.app = this;

      if (!file.fn) this.compile(file, options);
      file.contents = Buffer.from(file.fn(data));
      return file;
    }
  };

  return engine;
};

module.exports.base = instance => {
  if (instance === void 0) throw new Error('expected an instance of "engine"');

  const engine = {
    name: 'base',
    instance,
    compileSync(file, options) {
      const opts = { imports: this.helpers, ...options };
      if (typeof file.fn !== 'function' || opts.recompile === true) {
        file.fn = instance.compile(file.contents.toString(), opts);
      }
      return file;
    },
    compile(file, options) {
      const opts = { imports: this.helpers, ...options };
      if (typeof file.fn !== 'function' || opts.recompile === true) {
        file.fn = instance.compile(file.contents.toString(), opts);
      }
      return file;
    },
    async render(file, locals, options) {
      if (typeof file.fn !== 'function') {
        engine.compile.call(this, file, options);
      }
      const str = await this.resolveIds(await file.fn(locals));
      file.contents = Buffer.from(str);
      return file;
    },
    renderSync(file, locals, options) {
      if (typeof file.fn !== 'function') {
        engine.compileSync.call(this, file, options);
      }
      file.contents = Buffer.from(file.fn(locals));
      return file;
    }
  };

  return engine;
};

module.exports.noop = () => {
  const engine = {
    name: 'noop',
    instance: {},
    compile(file) {
      const str = file.contents.toString();
      file.fn = () => str;
      return file;
    },
    async render(file) {
      return file;
    },
    renderSync(file, locals, options = {}) {
      file.contents = Buffer.from(file.fn());
      return file;
    }
  };
  return engine;
};
