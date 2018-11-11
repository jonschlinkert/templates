'use strict';

/**
 * Noop engine
 */

exports.noop = () => {
  const engine = {
    name: 'noop',
    instance: {},
    async compile(file) {
      return engine.compileSync(file);
    },
    async render(file) {
      return file;
    },
    compileSync(file) {
      file.fn = () => file.contents.toString();
      return file;
    },
    renderSync(file) {
      return file;
    }
  };
  return engine;
};
