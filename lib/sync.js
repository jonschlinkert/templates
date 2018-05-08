'use strict';

const { define } = require('./utils');
const View = require('./view');

module.exports = function(app) {
  define(app, 'renderLayout', function(view, options, fn) {
    const opts = { engine: view.engine, ...this.options, ...options };
    if (opts.render === false || opts.engine === false) return view;

    const layouts = (this.kinds && this.kinds.layout) || opts.layouts;
    const engine = this.engine('layout');

    this.handle('preLayout', view);

    if (view.layout && layouts) {
      opts.transform = fn;
      opts.layouts = layouts;
      engine.renderSync(view, null, opts);
    }

    this.handle('postLayout', view);
    return view;
  });

  define(app, 'compile', function(val, options = {}) {
    const view = this.get(val);
    if (!View.isView(view)) {
      throw new Error('expected a view object');
    }

    if (view.fn && options.recompile !== true) return view;
    const opts = { engine: view.engine, ...this.options, ...options };
    if (opts.render === false || opts.engine === false) return view;

    const engine = this.engine(opts.engine);
    this.handle('preCompile', view);
    this.renderLayout(view, options);
    engine.compile.call(this, view, options);
    this.handle('postCompile', view);
    return view;
  });

  define(app, 'render', function(val, locals, options) {
    const { view, opts, engine, context } = this.prepareRender(val, locals, options);

    if (opts.render === false || opts.engine === false) return view;
    this.handle('preRender', view);
    this.compile(view, opts);
    engine.renderSync.call(this, view, context, opts);
    this.handle('postRender', view);
    return view;
  });
};
