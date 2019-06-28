'use strict';

const isBinary = file => typeof file.isBinary === 'function' && file.isBinary();
const PluginError = require('./plugin-error');
const through = require('./through');

/**
 * Pipeline plugin for rendering a file.
 *
 * ```js
 * app.src('*.hbs')
 *   .pipe(app.renderFile())
 *   .pipe(app.dest(process.cwd()));
 * ```
 * @name .renderFile
 * @param  {Object} [locals] Locals to use as context for rendering templates.
 * @param  {Object} [options.flush]
 * @return {Object}
 * @api public
 */

module.exports = (app, locals = {}, options = {}) => {
  let files = [];
  let engine = null;

  if (typeof locals === 'string') {
    let temp = options;
    engine = locals;
    options = { engine };
    locals = temp;
  }

  let opts = { ...app.options, ...options };
  if (engine === null) engine = opts.engine;
  let errored = false;

  return through.obj(async function(file, enc, next) {
    if (errored) return next();
    if (file.isNull() || isBinary(file)) {
      next(null, file);
      return;
    }

    try {
      await app.handle('onLoad', file);
      if (opts.flush === false) {
        let fileEngine = file.engine;
        if (engine) file.engine = engine;
        await app.render(file, { ...locals, ...file.data });
        file.engine = fileEngine;
        next(null, file);
        return;
      }

      files.push(file);
      app.emit('prepareDest', file);
    } catch (err) {
      errored = true;
      this.emit('error', new PluginError('render', err.message, { showStack: true, error: err }));
      files = [];
    }
    next();
  }, async function(cb) {
    try {
      for (let file of files) {
        let fileEngine = file.engine;
        if (engine) file.engine = engine;
        file = await app.render(file, { ...locals, ...file.data });
        file.engine = fileEngine;
        this.push(file);
      }
      cb();
    } catch (err) {
      cb(err);
    }
  });
};
