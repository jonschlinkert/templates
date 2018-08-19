'use strict';

const bench = require('setup/bench');
const Templates = require('templates');

/**
 * App instantiation
 */

bench('app', true)
  .add('no options', () => {
    new Templates();
  })
  .add('options.sync', () => {
    new Templates({ sync: true });
  })
  .add('options.streams = false', () => {
    new Templates({ streams: false });
  })
  .add('options.handlers', () => {
    new Templates({
      handlers: ['onLoad', 'preRender', 'postRender', 'preWrite', 'postWrite']
    });
  })
  .add('options.handlers + options.sync', () => {
    new Templates({
      handlers: ['onLoad', 'preRender', 'postRender', 'preWrite', 'postWrite'],
      sync: true
    });
  })
  .add('options.helpers', () => {
    new Templates({
      helpers: {
        foo() {},
        bar() {},
      }
    });
  })
  .run();
