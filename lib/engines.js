'use strict';

module.exports = handlebars => {
  const instance = handlebars.create();
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

    render(view, locals, options = {}) {
      register(this, options);

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
    compile(view, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (typeof view.fn !== 'function' || opts.recompile === true) {
        view.fn = base.compile(view.contents.toString(), opts);
      }
      return view;
    },
    render(view, locals) {
      view.contents = Buffer.from(view.fn(locals));
      return view;
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
    render(view, locals, options = {}) {
      view.contents = Buffer.from(view.fn());
      return view;
    }
  };
  return engine;
};
