'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  var Base = App.Base;

  describe('app', function() {
    describe('constructor', function() {
      it('should create an instance of App:', function() {
        app = new App();
        assert(app instanceof App);
      });

      it('should new up without new:', function() {
        app = App();
        assert(app instanceof App);
      });
    });

    describe('static methods', function() {
      it('should expose `extend`:', function() {
        assert.equal(typeof App.extend, 'function');
      });
    });

    describe('prototype methods', function() {
      beforeEach(function() {
        app = new App();
      });

      it('should expose `set`', function() {
        assert.equal(typeof app.set, 'function');
      });
      it('should expose `get`', function() {
        assert.equal(typeof app.get, 'function');
      });
      it('should expose `visit`', function() {
        assert.equal(typeof app.visit, 'function');
      });
      it('should expose `define`', function() {
        assert.equal(typeof app.define, 'function');
      });
      it('should expose `views`', function() {
        assert.equal(typeof app.views, 'object');
      });
    });

    describe('instance', function() {
      beforeEach(function() {
        app = new App();
      });

      it('should set a value on the instance:', function() {
        app.set('a', 'b');
        assert.equal(app.a, 'b');
      });

      it('should get a value from the instance:', function() {
        app.set('a', 'b');
        assert.equal(app.get('a'), 'b');
      });
    });

    describe('initialization', function() {
      it('should listen for errors:', function(cb) {
        app = new App();
        app.on('error', function(err) {
          assert.equal(err.message, 'foo');
          cb();
        });
        app.emit('error', new Error('foo'));
      });

      it('should expose constructors from `lib`:', function() {
        app = new App();
        app.expose('Collection');
        assert.equal(typeof app.Collection, 'function');
      });

      it('should update constructors after init:', function() {
        var Group = App.Group;
        function MyGroup() {
          Base.call(this);
        }
        Base.extend(MyGroup);

        app = new App();
        assert.equal(app.Group, Group);
        assert.equal(app.get('Group'), Group);
        app.option('Group', MyGroup);
        assert.equal(app.Group, MyGroup);
        assert.equal(app.get('Group'), MyGroup);
      });

      it('should mixin prototype methods defined on options:', function() {
        app = new App({
          mixins: {
            foo: function() {}
          }
        });
        assert.equal(typeof app.foo, 'function');
        delete App.prototype.foo;
      });

      it('should expose `_` on app:', function() {
        app = new App();
        assert.equal(typeof app._, 'object');
      });

      it('should not re-add `_` in init:', function() {
        app = new App();
        app._.foo = 'bar';
        app.initTemplates();
        assert.equal(app._.foo, 'bar');
      });
    });
  });
};
