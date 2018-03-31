'use strict';

const wait = fn => new Promise(resolve => setTimeout(() => resolve(fn()), 1));

exports.hbs = {
  partialName: function(options) {
    return options && options.hash.name ? options.hash.name : this.customName;
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

exports.hbsSync = {
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
  }
};

exports.hbsAsync = {
  getPartial: async function(str) {
    return await wait(() => str);
  },
  block: async function(options) {
    return await wait(() => options.fn(this));
  },
  useHash: async function(options) {
    return await wait(() => options.fn(options.hash || {}));
  },
  spacer: async function(str, delim, options) {
    if (typeof delim === 'object') {
      options = delim;
      delim = ' ';
    }
    return await wait(() => str.split('').join(delim));
  }
};

exports.commonAsync = {
  print: function(str) {
    /* eslint-disable no-console */
    console.log(str);
    return '';
  },
  getUser: function(obj, prop) {
    return obj[prop].toString();
  },
  lower: async function(str) {
    return await wait(() => str.toLowerCase());
  },
  upper: async function(str) {
    return await wait(() => {
      return str.toUpperCase();
    });
  },
  is: async function(val) {
    return await wait(async() => await val === true);
  },
  equals: async(a, b) => {
    return await wait(async() => await a === await b);
  }
};

exports.commonSync = {
  print: function(str) {
    /* eslint-disable no-console */
    console.log(str);
    return '';
  },
  getUser: function(obj, prop) {
    return obj[prop].toString();
  },
  lower: function(str) {
    return str.toLowerCase();
  },
  upper: function(str) {
    return str.toUpperCase();
  },
  is: function(val) {
    return val === true;
  },
  equals: (a, b) => {
    return a === b;
  }
};

exports.lodash = {
  spacer: function(str, delim) {
    return wait(() => str.split('').join(delim || ' '));
  },
  sum: function sum(...args) {
    let total = 0;
    for (const arg of args) {
      if (Array.isArray(arg)) {
        total += sum.apply(this, arg);
      } else {
        total += arg;
      }
    }
    return total;
  },
};
