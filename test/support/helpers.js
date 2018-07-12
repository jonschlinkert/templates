'use strict';

exports.hbs = {
  partialName: function(options) {
    return options && options.hash.name ? options.hash.name : this.customName;
  },
  getPartial: function(str) {
    return str;
  },
  block: function(options) {
    return options.fn(this);
  },
  useHash: function(options) {
    return options.fn(options.hash || {});
  },
  spacer: function(str, delim, options) {
    if (typeof delim === 'object') {
      options = delim;
      delim = ' ';
    }
    return str.split('').join(delim);
  },
  sum: function sum(...args) {
    const opts = args.pop();
    let total = 0;
    for (const arg of args) {
      if (Array.isArray(arg)) {
        total += sum.apply(this, arg.concat(opts));
      } else {
        total += arg;
      }
    }
    return total;
  }
};

exports.common = {
  print(str) {
    /* eslint-disable no-console */
    console.log(str);
    return '';
  },
  getUser(obj, prop) {
    return obj[prop].toString();
  },
  prefix(prefix, str) {
    return prefix + str;
  },
  lower(str, options) {
    return str.toLowerCase();
  },
  upper(str) {
    return str.toUpperCase();
  },
  spacer: function(str, delim) {
    return str.split('').join(delim);
  },
  is(val) {
    return val === true;
  },
  equals(a, b) {
    return a === b;
  },
  sum: function sum(...args) {
    let total = 0;
    for (const arg of args) {
      if (Array.isArray(arg)) {
        total += sum.apply(this, args);
      } else {
        total += arg;
      }
    }
    return total;
  }
};
