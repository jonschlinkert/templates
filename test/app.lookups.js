/* deps: mocha */
var path = require('path');
var assert = require('assert');
var should = require('should');
var Templates = require('../');
var app;

describe('lookups', function () {
  beforeEach(function () {
    app = new Templates();
    app.create('page');
    app.pages('test/fixtures/**/*.*');
  });

  describe('lookups', function () {
    it('should find a view', function () {
      console.log(app.views.pages)
    });
  });
});
