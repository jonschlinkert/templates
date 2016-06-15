'use strict';

var opts = {alias: {pattern: 'p'}};
var argv = require('yargs-parser')(process.argv.slice(2), opts);
var runner = require('base-test-runner')(argv);
var suite = require('base-test-suite');
var templates = require('..');

/**
 * Run the tests in `base-test-suite`
 */

runner.on('templates', function(file) {
  require(file.path)(templates);
});

runner.addFiles('templates', suite.test.templates);
