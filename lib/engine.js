const resolve = require('./resolve');
const createFrame = obj => {
  const frame = Object.assign({}, obj);
  frame._parent = obj;
  return frame;
};

module.exports = handlebars => {
  const instance = handlebars.create();

  const register = function(app, options = {}) {
    if (options.helpers) {
      instance.registerHelper(options.helpers);
    }

    if (options.partials) {
      instance.registerPartial(options.partials);
    }
  };

  const engine = {
    name: 'handlebars',
    instance,

    /**
     * Compile
     */

    compile(view, options = {}) {
      if (typeof view.fn !== 'function' || options.recompile === true) {
        view.fn = instance.compile(view.contents.toString(), options);
      }
      return view;
    },

    /**
     * Render
     */

    async render(view, locals, options) {
      register(this, options);

      if (options.asyncHelpers === true) {
        const resolvePartial = instance.VM.resolvePartial.bind(instance.VM);
        instance.VM.resolvePartial = (name, context, options) => {
          const tok = app.ids.get(name);
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
      const res = await view.fn(data);
      const str = await resolve(this, res);
      view.contents = Buffer.from(str);
      return view;
    },

    /**
     * Render sync
     */

    renderSync(view, locals, options = {}) {
      register(this, options);
      const app = this;
      const data = Object.assign({ app, view }, locals, view.data);
      const ctx = createFrame(data);
      view.contents = Buffer.from(view.fn(ctx));
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
  }
};
