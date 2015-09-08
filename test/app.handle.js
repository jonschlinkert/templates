require('mocha');
require('should');
var path = require('path');
var assert = require('assert');
var Templates = require('../');
var app;

describe('handler', function () {
  beforeEach(function () {
    app = new Templates();
    app.create('pages');
    app.handlers(['foo']);
  })

  it('should support custom handle methods:', function (done) {
    var page = app.page('foo', {contents: null});

    app.handle('foo', page, function (err, view) {
      assert(typeof view.path === 'string');
      done();
    });
  });
});
