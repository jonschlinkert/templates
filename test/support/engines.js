const resolve = require('../../lib/resolve');

exports.base = base => {
  const engine = {
    name: 'base',
    instance: base,
    compile(file, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!file.fn) file.fn = base.compile(file.contents.toString(), opts);
    },
    compileSync(file, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!file.fn) file.fn = base.compile(file.contents.toString(), opts);
    },
    render: async function render(file, locals) {
      const res = await resolve(this, await file.fn(locals));
      file.contents = Buffer.from(res);
    }
  };
  return engine;
};
