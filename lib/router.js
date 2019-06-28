'use strict';

const utils = require('./utils');

module.exports = app => {
  // only register the router once
  if (app._router) return app._router;

  let { Router } = utils;
  let { handlers, sync = false, parallel = false } = app.options;

  let router = new Router({ handlers, sync, parallel });
  router.app = app;
  router.mixin(app);
  app.emit('router', router);

  router.on('handler', (name, handler) => {
    app[name] = handler.bind(router);
  });

  router.on('handle', (method, file, route) => {
    app.emit('handle', method, file, route);
    app.emit(method, file, route);
  });

  app._router = router;
  return router;
};
