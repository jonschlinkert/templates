const resolve = require('../../lib/resolve');

exports.base = base => {
  return {
    name: 'base',
    instance: base,
    compile: function(view, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!view.fn) view.fn = base.compile(view.contents.toString(), opts);
    },
    render: async function render(view, locals) {
      const res = await resolve(this, await view.fn(locals));
      view.contents = Buffer.from(res);
    }
  };
};
