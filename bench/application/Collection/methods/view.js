'use strict';

const bench = require('setup/bench');
const Collection = require('templates/lib/collection');
const collection = new Collection();

/**
 * collection.view();
 */

bench('collection-view', true)
  .add('collection.view() - key/value', () => {
    collection.view('foo', { path: 'foo/bar' });
  })
  .add('collection.view() - object', () => {
    collection.view({ path: 'foo/bar', contents: Buffer.from('foo') });
  })
  .run();
