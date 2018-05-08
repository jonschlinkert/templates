const path = require('path');

const timer = () => {
  const start = process.hrtime();
  return () => {
    return process.hrtime(start);
  };
};

function ns(n) {
  return n[0] * 1e9 + n[1];
}
function mµ(n) {
  return ns(n) / 1e3;
}
function ms(n) {
  return mµ(n) / 1e3;
}
function sec(n) {
  return ms(n) / 1e3;
}

const cache = {};
const renameKey = name => {
  return name[0] !== '/' ? path.join(process.cwd(), name + '.hbs') : name;
};

const resolveLayout = (layouts, name) => {
  const basename = name + '.hbs';

  if (layouts instanceof Map) {
    if (layouts.has(name)) {
      return layouts.get(name);
    }
    if (layouts.has(basename)) {
      return layouts.get(basename);
    }
    return;
  }

  let layout;
  if (cache[name]) return cache[name];
  if (layouts[name]) return layouts[name];
  if (layouts[basename]) {
    layout = layouts[basename];
    cache[name] = layout;
    return layout;
  }
  let key = renameKey(name);
  layout = layouts[key];
  if (!layout) layout = layouts[path.basename(name, path.extname(name))];
  if (layout) cache[name] = layout;
  return layout;
};

module.exports = function(app, view, layouts) {
  const buf = view.contents;
  const reset = () => (view.contents = buf);

  return function(max) {
    const time = timer();
    const num = max || 1000000;
    let i = 0;

    while (i++ < num) {
      app.render(view, { description: 'This is page: ' + i });
      reset();
    }

    function size(obj) {
      return obj instanceof Map ? obj.size : Object.keys(obj).length;
    }

    const total = time();
    const elapsed = sec(total).toFixed(2) + 's';
    const len = size(layouts);
    const actual = num * len; // size of the layout stack

    console.log('processed %s layouts in %s', actual.toLocaleString(), elapsed);
    console.log('1 layout per %s', (mµ(total) / actual).toFixed(4) + 'mµ');
    console.log();
  };
};

