'use strict';

const assert = require('assert');
const { define } = require('./utils');
const View = require('./view');

module.exports = function(app) {
  define(app, 'renderLayout', function(view, options, fn) {
    const opts = { ...this.options, ...options };
    if (opts.render === false || opts.engine === false) return view;

    const layouts = (this.kinds && this.kinds.layout) || opts.layouts;
    this.handle('preLayout', view);

    if (view.layout && layouts) {
      const engine = this.engine('layout');
      opts.onLayout = fn || opts.onLayout;
      opts.layouts = layouts;
      engine.renderSync(view, null, opts);
    }

    this.handle('postLayout', view);
    return view;
  });

  define(app, 'compile', function(val, options = {}) {
    const view = this.get(val);
    assert(View.isView(view), `cannot resolve view: ${val}`);

    // exit early
    if (!this.opt('render', options, view)) return view;
    if (!this.opt('engine', options, view)) return view;

    const opts = { ...this.options, ...options };
    if (opts.render === false || opts.engine === false) return view;

    const engine = this.engine(view.engine);
    this.handle('preCompile', view);
    this.renderLayout(view, options);

    if (view.fn && options.recompile !== true) return view;
    engine.compile.call(this, view, options);
    this.handle('postCompile', view);
    return view;
  });

  define(app, 'render', function(val, locals, options) {
    const view = this.get(val);
    assert(View.isView(view), `cannot resolve view: ${val}`);

    // exit early
    if (!this.opt('render', options, view)) return view;
    if (!this.opt('engine', options, view)) return view;

    const { opts, context } = this.prepareRender(view, locals, options);
    const engine = this.engine(view.engine);
    context.engine = engine;

    this.handle('preRender', view);
    this.compile(view, opts);
    engine.renderSync.call(this, view, context, opts);
    this.handle('postRender', view);
    return view;
  });
};
