'use strict';

var utils = require('../utils');

module.exports = function (app) {
  app.cache = {};
  app.cache.data = {};
  app.cache.context = {};
  app.items = {};
  app.views = {};

  init(app);

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

/**
 * Adds the `helpers` object to `app._` then:
 *
 *  - `async`: create an instance of `helper-cache'
 *  - `sync`: create an instance of `helper-cache'
 *
 * @param {Object} `app` Instance of templates
 */

function init(app) {
  if (typeof app._ === 'undefined') {
    utils.define(app, '_', {});
  }
  app._.helpers = {};
}
