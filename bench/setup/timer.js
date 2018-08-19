'use strict';

const pretty = require('pretty-time');
const colors = require('ansi-colors');

const timer = () => {
  const start = process.hrtime();
  return () => process.hrtime(start);
};

timer.cyan = (...args) => colors.cyan(pretty(...args.concat(2)));

const ns = timer.ns = n => n[0] * 1e9 + n[1];
const µs = n => ns(n) / 1e3;
const ms = n => µs(n) / 1e3;
const sec = n => ms(n) / 1e3;

timer.size = obj => {
  if (obj.views) obj = obj.views;
  return obj instanceof Map ? obj.size : Object.keys(obj).length;
};

timer.increment = (num = 1000, step = 5) => {
  let n = Math.floor(num / 100 / step);
  let inc = n;

  return i => {
    if (i === inc) {
      process.stdout.write('\r' + Math.floor((inc / num) * 100) + '%');
      inc += n;
    }
  };
};

module.exports = timer;
