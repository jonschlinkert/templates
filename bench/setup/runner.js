'use strict';

/* eslint-disable no-console */
const opts = { alias: { reset: 'r', verbose: 'v' }, boolean: ['r'], default: { r: true } };
const argv = require('minimist')(process.argv.slice(2), opts);
const timer = require('./timer');
const { cyan, increment, ns, size } = timer;

module.exports = (app, view, layouts) => {
  return async(num, step) => {
    let count = increment(num, step);
    let time = timer();
    let init = time();
    let i = 0;

    app.once('postRender', () => {
      init = time();
      time = timer();
    });

    while (i++ < num) {
      await app.render(view, { description: 'This is page: ' + i, layouts });
      if (argv.v) console.log(view.contents.toString());
      if (argv.r === true) view.reset();
      count(i);
    }

    console.log();

    let total = time();
    let len = size(layouts.files || layouts);
    let actual = num * len; // size of the layout stack

    process.stdout.write('\r');
    console.log('processed %s pages with %s layouts each:', num.toLocaleString(), len.toLocaleString());

    console.log(' ~%s first render', cyan(init));
    console.log(' ~%s per layout', cyan(ns(total) / actual));
    console.log(' ~%s per page', cyan(ns(total) / num));
    console.log(' ~%s total', cyan(total));
    console.log();
  };
};

module.exports.sync = (app, view, layouts, state) => {
  return (num, step) => {
    const count = increment(num, step);
    let time = timer();
    let init = time();

    // restart the timer after the first render
    app.once('postRender', () => {
      init = time();
      time = timer();
    });

    for (let i = 0; i < num; i++) {
      app.render(view, { description: 'This is page: ' + i });
      if (argv.v) console.log(view.contents.toString());
      if (argv.r === true) view.reset();
      count(i);
    }

    const total = time();
    const len = size(layouts.files || layouts);
    const actual = num * len; // size of the layout stack

    process.stdout.write('\r');
    console.log(state);
    console.log();
    console.log('processed %s pages with %s layouts each:', num.toLocaleString(), len.toLocaleString());
    console.log(' ~%s first render', cyan(init));
    console.log(' ~%s per layout', cyan(ns(total) / actual));
    console.log(' ~%s per page', cyan(ns(total) / num));
    console.log(' ~%s total', cyan(total));
    console.log();
  };
};

