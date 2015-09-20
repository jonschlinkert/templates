'use strict';

module.exports = function (app) {
  app.cache = {};
  app.cache.data = {};
  app.cache.context = {};
  app.items = {};
  app.views = {};

  app.viewTypes = {
    layout: [],
    renderable: [],
    partial: []
  };

  app.define('errors', {
    compile: {
      callback: 'is sync and does not take a callback function',
      engine: 'cannot find an engine for: ',
      method: 'expects engines to have a compile method',
    },
    render: {
      callback: 'is async and expects a callback function',
      engine: 'cannot find an engine for: ',
      method: 'expects engines to have a render method',
    },
    layouts: {
      registered: 'no layouts are registered, but one is defined: '
    }
  });
};
