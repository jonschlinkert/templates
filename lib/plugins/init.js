'use strict';

var utils = require('../utils');

module.exports = function(app) {
  app.cache = {};
  app.cache.data = {};
  app.cache.context = {};

  /**
   * Adds the `helpers` object to `app._` then:
   *
   *  - `async`: create an instance of `helper-cache'
   *  - `sync`: create an instance of `helper-cache'
   *
   * @param {Object} `app` Instance of templates
   */

  if (typeof app._ === 'undefined') {
    utils.define(app, '_', {});
  }

  app.engines = {};
  app._.engines = new utils.Engines(app.engines);
  app._.helpers = {
    async: {},
    sync: {}
  };

  app.viewTypes = {
    layout: [],
    partial: [],
    renderable: []
  };

  app.define('errors', {
    compile: {
      callback: 'is sync and does not take a callback function',
      engine: 'cannot find an engine for: %s',
      method: 'expects engines to have a compile method'
    },
    render: {
      callback: 'is async and expects a callback function',
      engine: 'cannot find an engine for: %s',
      method: 'expects engines to have a render method'
    },
    layouts: {
      registered: 'layout "%s" was defined on view "%s" but cannot be not found (common causes are incorrect glob patterns, renameKey function modifying the key, and typos in search pattern)'
    }
  });
};
