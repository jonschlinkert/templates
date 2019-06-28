'use strict';

const assert = require('assert');
const utils = require('./utils');
const File = require('./file');

/**
 * When `options.sync` is true, the methods in this file are used
 * to override async app and collection methods for rendering with
 * sync methods.
 */

module.exports = app => {
  utils.define(app, 'renderLayout', function(file, options, fn) {
    if (file.type === 'asset') return file;

    let opts = { ...this.options, ...options };
    if (opts.render === false || opts.engine === false) return file;

    this.handle('preLayout', file);

    let layouts = [opts.layouts, (this.types && this.types.layout), {}];
    opts.layouts = layouts.find(v => v || v === false);

    if (opts.layouts !== false) {
      let engine = this.engine('layout');
      opts.onLayout = fn || opts.onLayout;
      engine.renderSync(file, null, opts);
    }

    this.handle('postLayout', file);
    return file;
  });

  utils.define(app, 'compile', function(value, options = {}) {
    let file = this.get(value);
    assert(File.isFile(file), `cannot resolve file: ${value}`);

    // exit early
    if (file.type === 'asset') return file;
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

  utils.define(app, 'renderView', function(value, locals, options) {
    let { file, opts, context } = this.prepareRender(value, locals, options);

    if (file.type === 'asset') return file;
    let engine = this.engine(file.engine);
    context.engine = engine;

    this.handle('preRender', file);
    this.compile(file, opts);
    engine.renderSync.call(this, file, context, opts);
    this.handle('postRender', file);
    return file;
  });

  utils.define(app, 'render', function(...args) {
    return this.renderView(...args);
  });
};
