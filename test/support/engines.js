
exports.base = base => {
  const engine = {
    name: 'base',
    instance: base,
    compileSync(view, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!view.fn) view.fn = base.compile(view.contents.toString(), opts);
    },
    renderSync(view, locals, options) {
      if (!view.fn) engine.compileSync(view, options);
      view.contents = Buffer.from(view.fn(locals));
    }
  };
  return engine;
};
