'use strict';

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
    compileSync(file, options = {}) {
      if (typeof file.fn !== 'function' || options.recompile === true) {
        file.fn = instance.compile(file.contents.toString(), options);
      }
    },

    /**
     * Render
     */

    renderSync(file, locals, options = {}) {
      if (options.asyncHelpers === true) {
        return engine.render.apply(this, arguments);
      }
      register.call(this, options);
      const data = Object.assign({}, locals, file.data);
      const str = file.fn(data);
      file.contents = Buffer.from(str);
    },
    async renderAsync(file, locals, options) {
      register.call(this, options);
      const data = Object.assign({}, locals, file.data);
      const res = await file.fn(data);
      const str = await resolve(this, res);
      file.contents = Buffer.from(str);
    },

    /**
     * Render each
     */

    renderEachSync(files, locals, options = {}) {
      if (options.asyncHelpers === true) {
        return engine.renderEach.apply(this, arguments);
      }
      register.call(this, options);
      for (const key of Object.keys(files)) {
        engine.render(files[key], locals, options);
      }
    }
  };

  return engine;
};
