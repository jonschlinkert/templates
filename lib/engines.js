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
    compile(view, options) {
      return engine.compileSync(view, options);
    },
    compileSync(view, options = {}) {
      const { recompile, registerPartials } = options;

      if (typeof view.fn !== 'function' || recompile === true) {
        view.fn = instance.compile(view.contents.toString(), options);
      }

      if (registerPartials === false) return view;
      if (view.kind === 'partial' && !instance.partials[view.key]) {
        instance.registerPartial(view.key, view.fn);
      }
      return view;
    },

    async render(view, locals, options) {
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

      const data = Object.assign({}, locals, view.data);
      data.view = view;
      data.app = this;

      if (!view.fn) this.compile(view, options);
      const res = await view.fn(data);
      const str = await this.resolveIds(res);
      view.contents = Buffer.from(str);
      return view;
    },

    renderSync(view, locals, options) {
      register(this, options);

      const data = Object.assign({}, locals, view.data);
      data.view = view;
      data.app = this;

      if (!view.fn) this.compile(view, options);
      view.contents = Buffer.from(view.fn(data));
      return view;
    }
  };

  return engine;
};

module.exports.base = instance => {
  if (instance === void 0) throw new Error('expected an instance of "engine"');

  const engine = {
    name: 'base',
    instance,
    compileSync(view, options) {
      const opts = { imports: this.helpers, ...options };
      if (typeof view.fn !== 'function' || opts.recompile === true) {
        view.fn = instance.compile(view.contents.toString(), opts);
      }
      return view;
    },
    compile(view, options) {
      const opts = { imports: this.helpers, ...options };
      if (typeof view.fn !== 'function' || opts.recompile === true) {
        view.fn = instance.compile(view.contents.toString(), opts);
      }
      return view;
    },
    async render(view, locals, options) {
      if (typeof view.fn !== 'function') {
        engine.compile.call(this, view, options);
      }
      const str = await this.resolveIds(await view.fn(locals));
      view.contents = Buffer.from(str);
      return view;
    },
    renderSync(view, locals, options) {
      if (typeof view.fn !== 'function') {
        engine.compileSync.call(this, view, options);
      }
      view.contents = Buffer.from(view.fn(locals));
      return view;
    }
  };

  return engine;
};

module.exports.noop = () => {
  const engine = {
    name: 'noop',
    instance: {},
    compile(view) {
      const str = view.contents.toString();
      view.fn = () => str;
      return view;
    },
    async render(view) {
      return view;
    },
    renderSync(view, locals, options = {}) {
      view.contents = Buffer.from(view.fn());
      return view;
    }
  };
  return engine;
};
