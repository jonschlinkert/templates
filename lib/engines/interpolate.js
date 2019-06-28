'use strict';

const isPromise = val => typeof val === 'function' || val instanceof Promise;

exports.resolve = (input, ctx) => {
  return typeof input === 'function' ? input.call(ctx, ctx) : input;
};

const compile = (input, helpers, thisArg, fn, isAsync = false) => {
  return data => {
    let ctx = { ...thisArg, ...data, isAsync };
    let keys = [];
    let vals = [];

    if (helpers) {
      for (let key of Object.keys(helpers)) {
        if (ctx[key] === void 0) {
          ctx[key] = (...args) => helpers[key].call(ctx, ...args);
        }
      }
    }

    for (let key in ctx) {
      if (ctx.hasOwnProperty(key)) {
        keys.push(key);
        vals.push(ctx[key]);
      }
    }

    ctx.compile = exports.compile;
    ctx.render = (str, locals) => ctx.compile(str)({ ...ctx, ...locals });
    return fn(keys, vals, ctx);
  };
};

exports.compileSync = (input, helpers, thisArg) => {
  return compile(input, helpers, thisArg, (keys, vals, ctx) => {
    ctx.compile = exports.compileSync;
    return Function(keys, `return \`${input}\``).apply(ctx, vals);
  });
};

exports.compile = (input, helpers, thisArg) => {
  return compile(input, helpers, thisArg, async(keys, vals, ctx) => {
    while (isPromise(input)) input = await exports.resolve(input, ctx);
    let source = `return ((async() => \`${input.replace(/(?<!\\)\${/g, '${await ')}\`))()`;
    return Function(keys, source).apply(ctx, vals);
  }, true);
};

exports.render = async(input, locals, helpers) => {
  if (typeof input === 'string') {
    return exports.compile(input, helpers)(locals);
  }
  while (isPromise(input)) {
    input = await exports.resolve(input, locals);
  }
  return input;
};
