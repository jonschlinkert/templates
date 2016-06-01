'use strict';

var assert = require('assert');
var support = require('./support');
var hasProperties = support.hasProperties;

module.exports = function(App, options, runner) {
  var app;

  describe('collection.options', function() {
    beforeEach(function() {
      app = new App();
      app.create('page');
    });

    it('should set an option:', function() {
      assert(!app.pages.options.hasOwnProperty('foo'));
      app.pages.option('foo', 'bar');
      assert(app.pages.options.hasOwnProperty('foo'));
    });

    it('should extend options:', function() {
      app.pages('a.tmpl', {path: 'a.tmpl', content: '<%= a %>'});
      app.pages.option('a', 'b');
      app.pages.option('c', 'd');
      app.pages.option('e', 'f');
      hasProperties(app.pages.options, ['a', 'c', 'e']);
    });
  });
};
