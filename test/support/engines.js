const resolve = require('../../lib/resolve');

exports.handlebars = handlebars => {
  const hbs = handlebars.create();

  return {
    name: 'handlebars',
    instance: hbs,
    compile: function(view, options) {
      if (!view.fn) view.fn = hbs.compile(view.contents.toString(), options);
    },
    render: async function render(view, locals, options) {
      const resolvePartial = hbs.VM.resolvePartial.bind(hbs.VM);

      hbs.VM.resolvePartial = (name, context, options) => {
        const tok = this.ids.get(name);
        if (tok) {
          const opts = tok.options || {};
          const ctx = Object.assign({}, context, opts.hash);
          const args = tok.args.concat(tok.options);
          const res = tok.fn(...args);
          if (typeof res === 'string') {
            name = res;
          }
        }
        return resolvePartial(name, context, options);
      };

      const data = Object.assign({}, locals, view.data);
      if (options && options.helpers) {
        hbs.registerHelper(options.helpers);
      }
      if (options && options.partials) {
        hbs.registerPartial(options.partials);
      }

      let res = await resolve(this, await view.fn(data));
      view.contents = Buffer.from(res);
    }
  };
};

exports.lodash = lodash => {
  const _ = lodash.runInContext();

  return {
    name: 'lodash',
    instance: _,
    compile: function(view, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!view.fn) view.fn = _.template(view.contents.toString(), opts);
    },
    render: async function render(view, locals) {
      const res = await resolve(this, await view.fn(locals));
      view.contents = Buffer.from(res);
    }
  };
};
