'use strict';

const bench = require('setup/bench');
const View = require('templates/lib/view');

/**
 * View instantiation
 */

bench('view', true)
  .add('new View()', () => new View({ path: 'foo/bar' }))
  .run();
