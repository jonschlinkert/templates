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

module.exports = function(app, view, layouts) {
  const buf = view.contents;
  const reset = () => (view.contents = buf);

  return function(max) {
    setTimeout(function() {

    const time = timer();
    const num = max || 1000;
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

    console.log('processed %s pages with %s layouts each in %s:', num.toLocaleString(), len.toLocaleString(), elapsed);
    console.log(' ~%s per layout', (mµ(total) / actual).toFixed(4) + 'mµ');
    console.log(' ~%s per page', (mµ(total) / num).toFixed(4) + 'mµ');
    console.log();
    }, 100);

  };
};

