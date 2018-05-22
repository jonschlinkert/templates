'use strict';

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

      // resolve dynamic partials
      if (options.asyncHelpers === true) {
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

      const res = await view.fn(data);
      const str = await this.resolveIds(res);
      view.contents = Buffer.from(str);
      return view;
    },

    renderSync(view, locals, options = {}) {
      register(this, options);

      // const resolvePartial = instance.VM.resolvePartial.bind(instance.VM);
      // instance.VM.resolvePartial = (name, context, options) => {
      //   console.log(options)
      //   // if (typeof name === 'string' && name[0] === '<') {
      //   //   name = engine.instance.compile(name);
      //   // }
      //   return resolvePartial(name, context, options);
      // };

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

module.exports.base = base => {
  return {
    name: 'base',
    instance: base,
    compile: function(view, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!view.fn) view.fn = base.compile(view.contents.toString(), opts);
    },
    render: async function render(view, locals) {
      const res = await this.resolveIds(await view.fn(locals));
      view.contents = Buffer.from(res);
    }
  };
};

module.exports.noop = () => {
  const engine = {
    name: 'noop',
    instance: {},
    compile(view, options = {}) {
      const str = view.contents.toString();
      view.fn = () => str;
      return view;
    },
    async render() {
      return view;
    },
    renderSync(view, locals, options = {}) {
      view.contents = Buffer.from(view.fn());
      return view;
    }
  };
  return engine;
};
