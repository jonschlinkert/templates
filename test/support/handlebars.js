const resolve = require('../../lib/resolve');

module.exports = handlebars => {
  const instance = handlebars.create();

  const register = function(options) {
    if (options && options.helpers) {
      instance.registerHelper(options.helpers);
    }
    if (options && options.partials) {
      instance.registerPartial(options.partials);
    }

    if (options && options.asyncHelpers === true) {
      const resolvePartial = instance.VM.resolvePartial.bind(instance.VM);
      instance.VM.resolvePartial = (name, context, options) => {
        const tok = this.ids.get(name);
        if (tok) {
          const opts = tok.options || {};
          const args = tok.args.concat(tok.options);
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

    render(view, locals, options = {}) {
      if (options.asyncHelpers === true) {
        return engine.renderAsync.apply(this, arguments);
      }
      register.call(this, options);
      const data = Object.assign({}, locals, view.data);
      const str = view.fn(data);
      view.contents = Buffer.from(str);
    },
    async renderAsync(view, locals, options) {
      register.call(this, options);
      const data = Object.assign({}, locals, view.data);
      const res = await view.fn(data);
      const str = await resolve(this, res);
      view.contents = Buffer.from(str);
    },

    /**
     * Render each
     */

    renderEach(views, locals, options = {}) {
      if (options.asyncHelpers === true) {
        return engine.renderEachAsync.apply(this, arguments);
      }
      register.call(this, options);
      for (const key of Object.keys(views)) {
        engine.render(view, locals, options);
      }
    },
    async renderEachAsync(views, locals, options = {}) {
      register.call(this, options);
      for (const key of Object.keys(views)) {
        await engine.renderAsync(view, locals, options);
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
