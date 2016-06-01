'use strict';

var path = require('path');
var opts = {alias: {pattern: 'p'}};
var argv = require('yargs-parser')(process.argv.slice(2), opts);
var templates = require('..');
var runner = require('base-test-runner')(argv);

runner.on('templates', function(file) {
  if (file.stem !== 'index') {
    require(file.path)(templates);
  }
});

runner.addFiles('templates', path.resolve(__dirname));
