'use strict';

const timestamp = require('time-stamp');
const pretty = require('pretty-time');
const colors = require('ansi-colors');
const { blue, dim, cyan, gray, magenta, ok, white, unstyle } = colors;
const times = {};

module.exports = (color = 'blue') => {
  const logger = {};

  logger.ns = n => n[0] * 1e9 + n[1];

  const stamp = logger.timestamp = () => {
    return '[' + gray(timestamp('mm:ss:ms')) + ']';
  };

  logger.time = (n = 12) => {
    let start = process.hrtime();
    return () => {
      return magenta(pretty(process.hrtime(start), 'μs').padEnd(n));
    };
  };

  logger.differ = () => {
    let start = process.hrtime();
    return () => {
      let diff = process.hrtime(start);
      start = process.hrtime();
      return pretty(diff, 'μs');
    };
  };

  logger.separator = (prefix, options, suffix) => {
    if (typeof prefix !== 'string') {
      suffix = options;
      options = prefix;
      prefix = '';
    }

    if (typeof suffix !== 'string') suffix = '';


    let opts = { length: 5, line: colors.symbols.line, ...options };
    let line = dim(opts.line.repeat(opts.length));
    if (prefix) prefix += ' ';
    if (suffix) suffix = ' ' + suffix;
    console.log(prefix + line + suffix);
  };

  logger.starting = (name, color = 'cyan') => {
    times[name] = { diff: logger.time(), color }
    // console.log(stamp(), white('starting'), header(name), ...rest);
  };

  logger.finished = (name, ...rest) => {
    let time = times[name];
    if (!time) return;
    const format = str => colors[color](str.padStart(10));
    console.log(format(name), ...rest, time.diff());
  };

  return logger;
};

