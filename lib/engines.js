const resolve = require('./resolve');

module.exports = handlebars => {
  const instance = handlebars.create();

  const register = function(app, options = {}) {
    if (options.helpers) {
      instance.registerHelper(options.helpers);
    }

    if (options.partials) {
      instance.registerPartial(options.partials);
    }

    if (options.registerPartials === false) return;
    if (!instance.registered && app.cache.partials) {
      instance.registered = true;
      instance.registerPartial(app.cache.partials);
    }
  };

  /**
   * Engine
   */

  const engine = {
    name: 'handlebars',
    instance,
    compile(view, options = {}) {
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

    async render(view, locals, options = {}) {
      register(this, options);

      if (options.asyncHelpers === true) {
        const resolvePartial = instance.VM.resolvePartial.bind(instance.VM);
        instance.VM.resolvePartial = (name, context, options) => {
          const tok = this.ids.get(name);
          if (tok) {
            const opts = tok.options || {};
            const args = tok.args.concat(opts);
            const res = tok.fn(...args);
            if (typeof res === 'string') {
              name = res;
            }
          }
          return resolvePartial(name, context, options);
        };
      }

      const data = Object.assign({}, locals, view.data);
      data.view = view;
      data.app = this;

      const res = await view.fn(data);
      const str = await resolve(this, res);
      view.contents = Buffer.from(str);
      return view;
    },

    renderSync(view, locals, options = {}) {
      register(this, options);

      const app = this;
      const data = Object.assign({}, locals, view.data);
      data.view = view;
      data.app = this;

      view.contents = Buffer.from(view.fn(data));
      return view;
    }
  };

  return engine;
};

module.exports.noop = function() {
  return {
    name: 'noop',
    instance: {},
    compile(view, options = {}) {
      view.fn = view.fn || (() => {});
      return view;
    },
    async render(view) {
      return view;
    },
    renderSync(view) {
      return view;
    }
  };
};
