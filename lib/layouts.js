'use strict';

const path = require('path');
const assert = require('assert');
const utils = require('./utils');
const noop = str => str;

function render(file, layouts, options = {}) {
  assert(utils.isObject(file), 'expected file to be an object');
  assert(utils.isObject(layouts), 'expected layouts collection to be an object');

  if (isNull(file)) return file;
  assert(utils.isBuffer(file.contents), 'expected file.contents to be a buffer');

  let onLayout = options.onLayout || noop;
  let history = options.history || file.layoutHistory || (file.layoutHistory = []);
  let regex = options.layoutRegex || /{% body %}/g;
  let name = getLayoutName(file, options);
  if (!name) return file;

  let str = contents(file, options);
  let layout = getLayout(name, file, layouts, options);

  // apply layouts
  while (name && layout && !history.includes(layout)) {
    history.push(layout);

    const prev = str;
    str = renderLayout(name, str, layout, regex, options);
    str = onLayout(str, file, layout) || str;

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
    let filename = file.key || file.relative || file.path;
    let val = filename ? `"${filename}"` : 'the given file';
    let msg = `layout "${name}" is defined on ${val} but cannot be found`;
    let err = new Error(msg);
    err.file = file;
    throw err;
  }
}

/**
 * Apply the current layout
 */

function renderLayout(name, str, layout, regex, options) {
  if (!utils.isBuffer(layout.contents)) {
    throw new Error('expected layout.contents to be a buffer');
  }

  let fn = layout.layoutFn;
  if (options.compileLayout === false || typeof fn !== 'function') {
    fn = compileLayout(name, layout, regex, options);
  }

  return fn(str, options);
}

function compileLayout(name, layout, regex, options) {
  let layoutStr = contents(layout, options);

  if (!regex.test(layoutStr)) {
    throw new Error(`cannot find tag "${regex.source}" in layout "${name}"`);
  }

  let render = (str, options) => {
    if (options.trimContents === true) {
      str = str.trim();
    }

    let res;
    if (options.preserveWhitespace === true) {
      let src = regex.source;
      let re = new RegExp(`(?:^(\\s+))?${src}`, 'gm');
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

  layout.layoutFn = render;
  return render;
}

/**
 * Get the name of the next layout to apply.
 */

function getLayoutName(file, options) {
  let { defaultLayout, layoutKey } = options;
  let key = layoutKey || 'layout';
  let name = file[key];
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
  let resolve = options.resolveLayout || resolveLayout;
  let layout = resolve(file, layouts, name);
  assertLayout(name, layout, file);
  assert(utils.isBuffer(layout.contents), 'expected layout.contents to be a buffer');
  return layout;
}

/**
 * Default resolve function, for getting the next layout.
 */

function resolveLayout(file, layouts, name) {
  if (layouts.files) return layouts.get(name); // use the collection's .get() method

  let basename = name + file.extname;
  return layouts instanceof Map
    ? (layouts.get(name) || layouts.get(basename) || layouts.get(path.resolve(basename)))
    : (layouts[name] || layouts[basename]);
}

/**
 * Gets the contents string from a file object
 */

function contents(file, options) {
  const str = (file.contents || '').toString();
  return options.trim ? str.trim() : str;
}

render.clearCache = () => {};

render.engine = app => {
  const engine = {
    name: 'layout',
    instance: {},
    async compile(file, options = {}) {
      return engine.compileSync.call(this, file, options);
    },
    async render(file, locals, options = {}) {
      engine.renderSync.call(this, file, locals, options);
      return file;
    },
    compileSync(file, options = {}) {
      if (!file.fn && options.recompile !== true) {
        file.fn = () => file.contents.toString();
      }
      return file;
    },
    renderSync(file, locals, options = {}) {
      let layouts = options.layouts || app.layouts;
      render(file, layouts, options);
      return file;
    }
  };
  return engine;
};

module.exports = render;
