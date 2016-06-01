'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('collection.events', function() {
    beforeEach(function() {
      app = new App();
      app.create('page');
    });

    it('should emit events:', function() {
      app.pages('a.tmpl', {path: 'a.tmpl', content: '<%= a %>'});
      var events = [];

      app.pages.on('option', function(key) {
        events.push(key);
      });

      app.pages.option('a', 'b');
      app.pages.option('c', 'd');
      app.pages.option('e', 'f');
      app.pages.option({g: 'h'});

      assert.deepEqual(events, ['a', 'c', 'e', 'g']);
    });
  });
};
