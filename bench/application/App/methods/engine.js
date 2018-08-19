'use strict';

const bench = require('setup/bench');
const Templates = require('templates');
const app = new Templates();

/**
 * .engine()
 */

bench('engines', true)
  .add('app.engine() - render function', () => {
    app.engine('hbs', () => {});
  })
  .add('app.engine() - object', () => {
    app.engine('hbs', { render: () => {}, compile: () => {} });
  })
  .run();
