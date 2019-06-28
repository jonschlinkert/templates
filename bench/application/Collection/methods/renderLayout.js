'use strict';

const bench = require('setup/bench');
const Collection = require('templates/lib/collection');
const collection = new Collection('pages');

/**
 * .renderLayout() (TODO)
 */

bench('collection-renderLayout', true)
  .add('collection.renderLayout()', () => {
    collection.engine('hbs', engine(handlebars));
  })
  .run();
