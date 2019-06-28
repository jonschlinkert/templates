'use strict';

const symbol = Symbol.for('TEMPLATES_LAYOUTS');
const path = require('path');
const assert = require('assert');
const utils = require('./utils');
const WHITESPACE_REGEX = /(?:^([^\S\n]+))?{% body %}/gm;
const BODY_REGEX = /{% body %}/g;
const isValid = value => utils.isObject(value) || utils.typeOf(value) === 'map';

const render = (file, layouts, options = {}) => {
  assert(utils.isObject(file), 'expected file to be an object');
  assert(isValid(layouts), 'expected layouts collection to be an object');

  // if (file.contents == null) return file;
  // assert(utils.isBuffer(file.contents), 'expected file.contents to be a buffer');

  let onLayout = options.onLayout || (str => str);
  let history = options.layoutHistory || file.layoutHistory || (file.layoutHistory = []);
  let regex = options.layoutRegex || BODY_REGEX;
  let name = getLayoutName(file, options);
  if (!name) return file;

  let str = contents(file, options);
  let layout = getLayout(name, file, layouts, options);

  // apply layouts
  while (name && layout && !history.includes(layout)) {
    history.push(layout);

    let prev = str;
    file.data.layout = layout;
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
};

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
  if (options.recompileLayout === true || typeof fn !== 'function') {
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
    let res;

    if (options.trimContents === true) str = str.trim();
    if (options.preserveWhitespace === true) {
      let re = WHITESPACE_REGEX;
      if (regex !== BODY_REGEX) {
        re = new RegExp(`(?:^([^\\S\\n]+))?${regex.source}`, 'gm');
      }

      layout[symbol] = layout[symbol] || {};
      let lines = layout[symbol].lines;

      res = layoutStr.replace(re, (m, whitespace) => {
        if (whitespace) {
          // only split once, on-demand
          lines = lines || (layout[symbol].lines = str.split(/\r?\n/));
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

  if (name === void 0 || name === true || name === defaultLayout) {
    return defaultLayout;
  }

  let falsey = ['false', 'null', 'nil', 'none'];
  if (name == null || falsey.includes(String(name).toLowerCase())) {
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
  // Otherwise, "layouts" is a Map or plain object
  let basename = name + file.extname;

  // If "layouts" is a Collection, use its .get() method
  if (layouts.files) {
    return layouts.get(name) || layouts.get(basename);
  }

  return utils.typeOf(layouts) === 'map'
    ? (layouts.get(name) || layouts.get(basename) || layouts.get(path.resolve(basename)))
    : (layouts[name] || layouts[basename]);
}

/**
 * Gets the contents string from a file object
 */

function contents(file, options) {
  let str = (file.contents || '').toString();
  return options.trimContents ? str.trim() : str;
}

render.clearCache = () => {};

render.engine = app => {
  return {
    name: 'layout',
    instance: {},
    async compile(file) {
      return file;
    },
    async render(file, locals, options = {}) {
      render(file, options.layouts || app.layouts, options);
      return file;
    },
    compileSync(file) {
      return file;
    },
    renderSync(file, locals, options = {}) {
      render(file, options.layouts || app.layouts, options);
      return file;
    }
  };
};

module.exports = render;
