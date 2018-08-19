'use strict';

const bench = require('setup/bench');
const Templates = require('templates');
const app = new Templates();

/**
 * .create()
 */

bench('app-create', true)
  .add('app.create()', () => {
    app.create('pages');
  })
  .add('app.create() with options', () => {
    app.create('layouts', { kind: 'layout' });
  })
  .add('view from app.create() collection', () => {
    app.create('layouts', { kind: 'layout' });
    app.layouts.set('foo', { path: 'foo/bar' });
  })
  .run();
