'use strict';

module.exports = handlebars => {
  const instance = handlebars.create();

  const register = function(options) {
    if (options && options.helpers) {
      instance.registerHelper(options.helpers);
    }
    if (options && options.partials) {
      instance.registerPartial(options.partials);
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

    /**
     * Render each
     */

    renderEach(views, locals, options = {}) {
      if (options.asyncHelpers === true) {
        return engine.renderEachAsync.apply(this, arguments);
      }
      register.call(this, options);
      for (const key of Object.keys(views)) {
        engine.render(views[key], locals, options);
      }
    }
  };

  return engine;
};
