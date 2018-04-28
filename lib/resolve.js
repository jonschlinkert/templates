'use strict';

const utils = require('./utils');

/**
 * Resolve async helper IDs.
 */

async function resolveIds(app, val) {
  switch (utils.typeOf(val)) {
    case 'string':
      let tok = app.ids.get(val);
      if (tok) {
        let args = await resolveIds(app, tok.args.concat(tok.options));
        let result = await tok.fn(...args);
        if (typeof result === 'number') {
          result = String(result);
        }
        return result;
      }

      const m = /@@ASYNCID(\d+)@@/.exec(val);
      if (!m) return val;

      const id = m[0];
      tok = app.ids.get(id);
      const prefix = val.slice(0, m.index);
      const suffix = val.slice(m.index + id.length);
      const args = await resolveIds(app, tok.args);
      const opts = { ...tok.options };

      if (opts.hash) opts.hash = await resolveIds(app, { ...opts.hash });
      let res = await resolveIds(app, tok.value || await tok.fn(...args.concat(opts)));
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
      const arr = [];
      for (const ele of val) {
        const tok = app.ids.get(ele);
        const res = await resolveIds(app, ele);
        arr.push(res);
      }
      return arr;
    default: {
      return val;
    }
  }
}

resolveIds.wrap = function(app, name, helper) {
  const toId = app.toId = () => `@@ASYNCID${app.id++}@@`;
  app.id = app.id || 0;

  const wrapped = function(...args) {
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
    ctx.app = app;

    fn = (...arr) => {
      return helper.call(ctx, ...arr);
    };

    app.ids.set(id, { name, args, fn, helper, options });
    return id;
  };

  wrapped.fn = helper;
  return wrapped;
};

module.exports = resolveIds;
