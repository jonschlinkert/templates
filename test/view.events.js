'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('view.events', function() {
    beforeEach(function() {
      app = new App();
      app.create('page');
    });

    it('should emit events:', function() {
      app.pages('a.tmpl', {path: 'a.tmpl', content: '<%= a %>'});
      var page = app.pages.getView('a.tmpl');
      var events = [];

      page.on('option', function(key) {
        events.push(key);
      });

      page.option('a', 'b');
      page.option('c', 'd');
      page.option('e', 'f');
      page.option({g: 'h'});

      assert.deepEqual(events, ['a', 'c', 'e', 'g']);
    });
  });
};
