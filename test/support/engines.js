const resolve = require('../../lib/resolve');

exports.base = base => {
  const engine = {
    name: 'base',
    instance: base,
    compile(view, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!view.fn) view.fn = base.compile(view.contents.toString(), opts);
    },
    compileSync(view, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!view.fn) view.fn = base.compile(view.contents.toString(), opts);
    },
    render: async function render(view, locals) {
      const res = await resolve(this, await view.fn(locals));
      view.contents = Buffer.from(res);
    }
  };
  return engine;
};
