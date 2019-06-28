'use strict';

module.exports = (instance, resolveIds) => {
  if (instance === void 0) {
    throw new Error('expected an instance of "jonschlinkert/engine"');
  }

  const shouldCompile = (file, options) => {
    return typeof file.fn !== 'function' || options.recompile === true;
  };

  const toFile = file => {
    if (typeof file === 'string') {
      return { contents: Buffer.from(file) };
    }
    return file;
  };

  const engine = {
    name: 'base',
    instance,
    compileSync(file, options = {}) {
      file = toFile(file);

      let imports = { ...this.helpers, ...options.helpers, ...options.imports };
      let opts = { ...options, imports };

      if (shouldCompile(file, opts)) {
        file.fn = instance.compile(file.contents.toString(), opts);
      }
      return file;
    },

    renderSync(file, locals, options) {
      file = toFile(file);

      if (shouldCompile(file, options)) {
        engine.compileSync.call(this, file, { ...locals, ...options });
      }

      file.contents = Buffer.from(file.fn(locals));
      return file;
    },

    async compile(file, options) {
      return engine.compileSync(file, options);
    },

    async render(file, locals, options) {
      file = toFile(file);

      if (shouldCompile(file, options)) {
        await engine.compile.call(this, file, { ...locals, ...options });
      }

      let res = await file.fn(locals);
      let str = this.resolveIds ? await this.resolveIds(res) : res;
      file.contents = Buffer.from(str);
      return file;
    }
  };

  return engine;
};
