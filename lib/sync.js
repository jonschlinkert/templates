'use strict';

const assert = require('assert');
const { define } = require('./utils');
const File = require('./file');

/**
 * When `options.sync` is true, the methods in this file are used
 * to override async app and collection methods for rendering with
 * sync methods.
 */

module.exports = app => {
  define(app, 'renderLayout', function(file, options, fn) {
    let opts = { ...this.options, ...options };
    if (opts.render === false || opts.engine === false) return file;

    let layouts = (this.kinds && this.kinds.layout) || opts.layouts;
    this.handle('preLayout', file);

    if (file.layout && layouts) {
      let engine = this.engine('layout');
      opts.onLayout = fn || opts.onLayout;
      opts.layouts = layouts;
      engine.renderSync(file, null, opts);
    }

    this.handle('postLayout', file);
    return file;
  });

  define(app, 'compile', function(val, options = {}) {
    let file = this.get(val);
    assert(File.isFile(file), `cannot resolve file: ${val}`);

    // exit early
    if (!this.opt('render', options, file)) return file;
    if (!this.opt('engine', options, file)) return file;

    let opts = { ...this.options, ...options };
    if (opts.render === false || opts.engine === false) return file;

    let engine = this.engine(file.engine);
    this.handle('preCompile', file);
    this.renderLayout(file, options);

    if (file.fn && options.recompile !== true) return file;
    engine.compile.call(this, file, options);
    this.handle('postCompile', file);
    return file;
  });

  define(app, 'renderFile', function(value, locals, options) {
    let { file, opts, context } = this.prepareRender(value, locals, options);
    let engine = this.engine(file.engine);
    context.engine = engine;

    this.handle('preRender', file);
    this.compile(file, opts);
    engine.renderSync.call(this, file, context, opts);
    this.handle('postRender', file);
    return file;
  });

  define(app, 'render', function(...args) {
    return this.renderFile(...args);
  });
};
