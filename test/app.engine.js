'use strict';

const path = require('path');
const assert = require('assert');
const Collection = require('../lib/collection');
const App = require('..');
let app;

describe('app.engine', function() {
  beforeEach(function() {
    app = new App();
  })

  it('should allow the noop engine to be set on options', function() {
    app.option('engine', 'noop');
    console.log(app)
  });
});
