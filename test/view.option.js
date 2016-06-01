'use strict';

var assert = require('assert');
var support = require('./support');
var hasProperties = support.hasProperties;

module.exports = function(App, options, runner) {
  var app;

  describe('view.option', function() {
    beforeEach(function() {
      app = new App();
      app.create('page');
    });

    it('should set an option:', function() {
      app.pages('a.tmpl', {path: 'a.tmpl', content: '<%= a %>'});
      var page = app.pages.getView('a.tmpl');

      assert(!page.options.hasOwnProperty('foo'));
      page.option('foo', 'bar');
      assert(page.options.hasOwnProperty('foo'));
    });

    it('should extend options:', function() {
      app.pages('a.tmpl', {path: 'a.tmpl', content: '<%= a %>'});
      var page = app.pages.getView('a.tmpl');
      page.option('a', 'b');
      page.option('c', 'd');
      page.option('e', 'f');
      hasProperties(page.options, ['a', 'c', 'e']);
    });
  });
};
