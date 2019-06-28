'use strict';

const bench = require('setup/bench');
const Collection = require('templates/lib/collection');
const collection = new Collection('pages');

/**
 * .engine()
 */

bench('engines', true)
  .add('collection.engine() - render function', () => {
    collection.engine('hbs', () => {});
  })
  .add('collection.engine() - object', () => {
    collection.engine('hbs', { render: () => {}, compile: () => {} });
  })
  .run();
