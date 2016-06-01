'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  describe('app.options.initTemplates', function() {
    it('should call `options.initTemplates` before any instance methods are called', function() {
      app = new App({
        initTemplates: function(app) {
          this.on('create', function(name, options) {
            options.viewType = 'partial';
          });
        }
      });

      app.create('includes');
      app.include('one', {path: 'two', contents: '...'});
      assert(app.includes.isType('partial'));
    });
  });
};
