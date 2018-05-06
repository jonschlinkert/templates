'use strict';

const utils = require('./utils');

/**
 * Resolve async helper IDs.
 */

async function resolveIds(app, val) {
  let tok, args, res, match, id, prefix, suffix, opts;

  switch (utils.typeOf(val)) {
    case 'string':
      tok = app.ids.get(val);
      if (tok) {
        args = await resolveIds(app, tok.args.concat(tok.options));
        res = await tok.fn(...args);
        if (typeof res === 'number') {
          res = String(res);
        }
        return res;
      }

      match = /@@ASYNCID(\d+)@@/.exec(val);
      if (!match) return val;

      id = match[0];
      tok = app.ids.get(id);
      prefix = val.slice(0, match.index);
      suffix = val.slice(match.index + id.length);
      opts = { ...tok.options };
      args = await resolveIds(app, tok.args);

      if (opts.hash) opts.hash = await resolveIds(app, { ...opts.hash });
      res = await resolveIds(app, tok.value || await tok.fn(...args.concat(opts)));
      if (typeof res !== 'undefined') {
        tok.value = res;
      }

      return await resolveIds(app, prefix + res + suffix);
    case 'object':
      if (val.app) {
        return val;
      }
      for (const key of Object.keys(val)) {
        val[key] = await resolveIds(app, val[key]);
      }

      return val;
    case 'function':
      return val;
    case 'array':
      res = [];
      for (const ele of val) {
        res.push(await resolveIds(app, ele));
      }
      return res;
    default: {
      return val;
    }
  }
}

resolveIds.wrap = function(app, name, helper) {
  const toId = app.toId = () => `@@ASYNCID${app.id++}@@`;
  app.id = app.id || 0;

  return function(...args) {
    let fn = (...arr) => helper.call({ app }, ...arr);
    const last = args[args.length - 1];
    let options = {};

    if (utils.typeOf(last) === 'object' && last.hash) {
      options = args.pop();
    }

    if (!this || typeof this !== 'object') {
      const res = helper.call({ app }, ...args);
      if (utils.typeOf(res) === 'promise') {
        const id = toId();
        app.ids.set(id, { name, args, fn, helper, options, value: res });
        return id;
      }
      return res;
    }

    const id = toId();
    const ctx = this;
    if (ctx !== null && typeof ctx === 'object') {
      ctx.app = app;
    }

    fn = (...arr) => {
      return helper.call(ctx, ...arr);
    };

    app.ids.set(id, { name, args, fn, helper, options });
    return id;
  };
};

module.exports = resolveIds;
