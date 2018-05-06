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
  };

  const engine = {
    name: 'handlebars',
    instance,
    compile(view, options = {}) {
      if (typeof view.fn !== 'function' || options.recompile === true) {
        view.fn = instance.compile(view.contents.toString(), options);
      }
    },

    /**
     * Render
     */

    async render(view, locals, options) {
      register(this, options);
      const data = Object.assign({}, locals, view.data);
      const res = await view.fn(data);
      const str = await resolve(this, res);
      view.contents = Buffer.from(str);
    },

    renderSync(view, locals, options = {}) {
      register(this, options);
      const app = this;
      const data = Object.assign({ app, view }, locals, view.data);
      const ctx = createFrame(data);
      view.contents = Buffer.from(view.fn(ctx));
    },

    /**
     * Render each
     */

    async renderEach(views, locals, options = {}) {
      register(this, options);
      for (const key of Object.keys(views)) {
        await engine.render(views[key], locals, options);
      }
    },
    renderEachSync(views, locals, options = {}) {
      if (options.asyncHelpers === true) {
        return engine.renderEach.apply(this, arguments);
      }
      register(this, options);
      for (const key of Object.keys(views)) {
        engine.renderSync(views[key], locals, options);
      }
    }
  };

  return engine;

  // return {
  //   name: 'handlebars',
  //   instance: instance,
  //   compile: function(view, options) {
  //     if (!view.fn) view.fn = instance.compile(view.contents.toString(), options);
  //   },
  //   render: async function render(view, locals, options) {
  //     const resolvePartial = instance.VM.resolvePartial.bind(instance.VM);

  //     instance.VM.resolvePartial = (name, context, options) => {
  //       const tok = this.ids.get(name);
  //       if (tok) {
  //         const opts = tok.options || {};
  //         const ctx = Object.assign({}, context, opts.hash);
  //         const args = tok.args.concat(tok.options);
  //         const res = tok.fn(...args);
  //         if (typeof res === 'string') {
  //           name = res;
  //         }
  //       }
  //       return resolvePartial(name, context, options);
  //     };

  //     const data = Object.assign({}, locals, view.data);
  //     if (options && options.helpers) {
  //       instance.registerHelper(options.helpers);
  //     }
  //     if (options && options.partials) {
  //       instance.registerPartial(options.partials);
  //     }

  //     let res = await resolve(this, await view.fn(data));
  //     view.contents = Buffer.from(res);
  //   }
  // };
};
