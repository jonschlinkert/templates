'use strict';

const bench = require('setup/bench');
const Collection = require('templates/lib/collection');

/**
 * Collection instantiation
 */

bench('new-collection', true)
  .add('new Collection()', () => {
    new Collection('pages');
  })
  .add('new Collection() with options', () => {
    new Collection('layouts', { type: 'layout' });
  })
  .run();
