console.time('grand total');
const pretty = require('pretty-time');
const colors = require('ansi-colors');
const cyan = (...args) => colors.cyan(pretty(...args));

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

function size(obj) {
  return obj instanceof Map ? obj.size : Object.keys(obj).length;
}

module.exports = function(app, view, layouts) {
  const buf = view.contents;
  const reset = () => (view.contents = buf);

  return async function(max) {
    setImmediate(async function() {
      const num = max || 1000;
      let time = timer();
      let init;
      let i = 0;

      app.router.once('postRender', function() {
        init = time();
        time = timer();
      });

      while (i++ < num) {
        await app.render(view, { description: 'This is page: ' + i });
        reset();
      }

      const total = time();
      const elapsed = sec(total).toFixed(2) + 's';
      const len = size(layouts);
      const actual = num * len; // size of the layout stack

      console.log('processed %s pages with %s layouts each in %s:', num.toLocaleString(), len.toLocaleString(), elapsed);

      console.log(' ~%s init', pretty(init));
      console.log(' ~%s per layout', pretty(ns(total) / actual));
      console.log(' ~%s per page', pretty(ns(total) / num));
      console.log();
    });
  };
};

module.exports.sync = function(app, view, layouts) {
  const buf = view.contents;
  const reset = () => (view.contents = buf);

  return function(num = 1000) {
    let time = timer();
    let init = time();

    app.router.once('postRender', function() {
      init = time();
      time = timer();
    });

    for (let i = 0; i < num; i++) {
      app.render(view, { description: 'This is page: ' + i });
      reset();
    }

    const total = time();
    const len = size(layouts);
    const actual = num * len; // size of the layout stack

    console.log('processed %s pages with %s layouts each:', num.toLocaleString(), len.toLocaleString());

    console.log(' ~%s init', cyan(init));
    console.log(' ~%s per layout', cyan(ns(total) / actual));
    console.log(' ~%s per page', cyan(ns(total) / num));
    console.log(' ~%s total', cyan(total));
    console.log();
    console.timeEnd('grand total');
    console.time('grand total');
  };
};

