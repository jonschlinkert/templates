'use strict';

const assert = require('assert');
const noop = str => str;

function render(file, layouts, options = {}) {
  assert(isObject(file), 'expected file to be an object');
  assert(isObject(layouts), 'expected layouts collection to be an object');

  if (isNull(file)) return file;
  assert(isBuffer(file.contents), 'expected file.contents to be a buffer');

  const { layoutKey, layoutRegex } = options;
  const transform = options.transform || noop;
  const history = options.history || file[render.symbol] || (file[render.symbol] = []);
  const regex = layoutRegex || /{% body %}/g;
  const cache = {};

  let name = getLayoutName(file, options);
  if (!name) return file;

  let str = contents(file, options);
  let layout = getLayout(name, file, layouts, options);

  // apply layouts
  while (name && layout && !history.includes(layout)) {
    history.push(layout);

    const prev = str;
    str = renderLayout(name, str, layout, regex, options);
    str = transform(str, file, layout) || str;

    if (str === prev) {
      throw new Error(`cannot find "${regex}" in layout "${name}"`);
    }

    name = getLayoutName(layout, options);
    layout = getLayout(name, file, layouts, options);
  }

  // update file.contents
  file.contents = Buffer.from(str);
  return file;
}

function isNull(file) {
  return file.isNull ? file.isNull() : file.contents == null;
}

function assertLayout(name, layout, file) {
  if (!layout) {
    const filename = file.key || file.relative || file.path;
    const val = filename ? `"${filename}"` : 'the given file';
    const msg = `layout "${name}" is defined on ${val} but cannot be found`;
    const err = new Error(msg);
    err.file = file;
    throw err;
  }
}

/**
 * Apply the current layout
 */

function renderLayout(name, str, layout, regex, options) {
  if (!isBuffer(layout.contents)) {
    throw new Error('expected layout.contents to be a buffer');
  }

  let fn = layout[render.compiled];
  if (options.compileLayout === false || typeof fn !== 'function') {
    fn = compileLayout(name, layout, regex, options);
  }

  return fn(str, options);
}

function compileLayout(name, layout, regex, options) {
  const layoutStr = contents(layout, options);

  if (!regex.test(layoutStr)) {
    throw new Error(`cannot find tag "${regex.source}" in layout "${name}"`);
  }

  const render = (str, options) => {
    let res;
    if (options.preserveWhitespace === true) {
      const src = regex.source;
      const re = new RegExp(`(?:^(\\s+))?${src}`, 'gm');
      let lines;

      res = layoutStr.replace(re, (m, whitespace) => {
        if (whitespace) {
          lines = lines || str.split(/\r?\n/); // only split once, on-demand
          return lines.map(line => whitespace + line).join('\n');
        }
        return str;
      });
    } else {
      res = layoutStr.replace(regex, str);
    }

    regex.lastIndex = 0;
    return res;
  };

  layout[render.compiled] = render;
  return render;
}

/**
 * Get the name of the next layout to apply.
 */

function getLayoutName(file, options) {
  const { defaultLayout, layoutKey } = options;
  const key = layoutKey || 'layout';
  const name = file[key];
  if (typeof name === 'undefined' || name === true || name === defaultLayout) {
    return defaultLayout;
  }
  if (!name || ['false', 'null', 'nil', 'none', 'undefined'].includes(name.toLowerCase())) {
    return false;
  }
  return name;
}

/**
 * Get the next layout from the layouts collection
 */

function getLayout(name, file, layouts, options) {
  if (!name) return;
  const resolve = options.resolveLayout || resolveLayout;
  const layout = resolve(file, layouts, name);
  assertLayout(name, layout, file);
  assert(isBuffer(layout.contents), 'expected layout.contents to be a buffer');
  return layout;
}

/**
 * Default resolve function, for getting the next layout.
 */

function resolveLayout(file, layouts, name) {
  return layouts instanceof Map
    ? layouts.get(name) || layouts.get(name + file.extname)
    : layouts[name] || layouts[name + file.extname];
}

/**
 * Gets the contents string from a file object
 */

function contents(file, options) {
  const str = (file.contents || '').toString();
  return options.trim ? str.trim() : str;
}

function isMap(val) {
  return val instanceof Map;
}

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isBuffer(val) {
  return val && typeof val === 'object' && val.constructor
    && typeof val.constructor.isBuffer === 'function'
    && val.constructor.isBuffer(val);
}

render.clearCache = () => {};
render.compiled = Symbol('compiled');
render.symbol = Symbol('layouts');
module.exports = render;

module.exports.engine = function() {
  const engine = {
    name: 'layout',
    instance: {},
    compile(view, options = {}) {
      if (!view.fn && options.recompile !== true) {
        view.fn = () => view.contents.toString();
      }
      return view;
    },
    async render(view, locals, options = {}) {
      engine.renderSync.call(this, view, locals, options);
      return view;
    },
    renderSync(view, locals, options = {}) {
      render(view, options.layouts, options);
      return view;
    }
  };
  return engine;
};
