'use strict';

/* deps: mocha */
var assert = require('assert');
var should = require('should');
var App = require('..');
var app;

describe('compile', function () {
  beforeEach(function () {
    app = new App();
    app.engine('tmpl', require('engine-base'));
    app.create('page');
  })

  it('should compile a template:', function () {
    app.pages('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', a: 'b'});

    var page = app.pages.getView('a.tmpl');
    var view = app.compile(page);
    assert.equal(typeof view.fn, 'function');
  });
});
