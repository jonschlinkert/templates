'use strict';

const bench = require('setup/bench');
const Templates = require('templates');
const app = new Templates();

/**
 * app.view();
 */

bench('app-view', true)
  .add('app.view() - key/value', () => {
    app.view('foo', { path: 'foo/bar' });
  })
  .add('app.view() - object', () => {
    app.view({ path: 'foo/bar', contents: Buffer.from('foo') });
  })
  .run();
