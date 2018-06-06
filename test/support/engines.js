
exports.base = base => {
  const engine = {
    name: 'base',
    instance: base,
    compile(view, options) {
      const opts = Object.assign({ imports: this.helpers }, options);
      if (!view.fn) view.fn = base.compile(view.contents.toString(), opts);
    },
    render(view, locals, options) {
      if (!view.fn) engine.compile(view, options);
      view.contents = Buffer.from(view.fn(locals));
    }
  };
  return engine;
};
