'use strict';

var assert = require('assert');
var support = require('./support/');
assert.containEql = support.containEql;

module.exports = function(App, options, runner) {
  var List = App.List;
  var Group = App.Group;
  var group;
  var app;

  describe('group', function() {
    describe('constructor', function() {
      it('should create an instance of Group:', function() {
        var group = new Group();
        assert(group instanceof Group);
      });

      it('should instantiate without new', function() {
        var group = Group();
        assert(group instanceof Group);
      });

      it('should create an instance of Group with default List:', function() {
        var group = new Group();
        assert.deepEqual(group.List, List);
      });

      it('should create an instance of Group with custom List:', function() {
        function CustomList() {
          List.apply(this, arguments);
        }
        List.extend(CustomList);
        var group = new Group({List: CustomList});
        assert.deepEqual(group.List, CustomList);
      });
    });

    describe('static methods', function() {
      it('should expose `extend`:', function() {
        assert.equal(typeof Group.extend, 'function');
      });
    });

    describe('prototype methods', function() {
      beforeEach(function() {
        group = new Group();
      });

      it('should expose `use`', function() {
        assert.equal(typeof group.use, 'function');
      });
      it('should expose `set`', function() {
        assert.equal(typeof group.set, 'function');
      });
      it('should expose `get`', function() {
        assert.equal(typeof group.get, 'function');
      });
      it('should expose `visit`', function() {
        assert.equal(typeof group.visit, 'function');
      });
      it('should expose `define`', function() {
        assert.equal(typeof group.define, 'function');
      });
    });

    describe('instance', function() {
      beforeEach(function() {
        group = new Group();
      });

      it('should expose options:', function() {
        assert.equal(typeof group.options, 'object');
      });

      it('should set a value on the instance:', function() {
        group.set('a', 'b');
        assert.equal(group.a, 'b');
      });

      it('should get a value from the instance:', function() {
        group.set('a', 'b');
        assert.equal(group.get('a'), 'b');
      });
    });

    describe('option', function() {
      it('should set options on group.options', function() {
        var group = new Group();
        group.option('a', {b: {c: 'd'}});
        assert.equal(group.option('a.b.c'), 'd');
      });
    });

    describe('get', function() {
      it('should get a normal value when not an array', function() {
        var group = new Group({'foo': {items: [1, 2, 3]}});
        assert.deepEqual(group.get('foo'), {items: [1, 2, 3]});
      });

      it('should get an instance of List when value is an array', function() {
        var group = new Group({'foo': {items: [{path: 'one.hbs'}, {path: 'two.hbs'}, {path: 'three.hbs'}]}});
        var list = group.get('foo.items');
        assert(list instanceof List);
        assert.deepEqual(list.items.length, 3);
      });

      it('should throw an error when trying to use a List method on a non List value', function(cb) {
        try {
          var group = new Group({'foo': {items: [1, 2, 3]}});
          var foo = group.get('foo');
          foo.paginate();
          cb(new Error('expected an error'));
        } catch (err) {
          assert.equal(err.message, 'paginate can only be used with an array of `List` items.');
          cb();
        }
      });

      it('should not override properties already existing on non List values', function(cb) {
        var group = new Group({'foo': {items: [1, 2, 3], paginate: function() {
          assert(true);
          cb();
        }}});
        var foo = group.get('foo');
        foo.paginate();
      });
    });

    describe('use', function() {
      beforeEach(function() {
        group = new Group();
      });

      it('should use plugins on a group:', function() {
        group.set('one', {contents: new Buffer('aaa')});
        group.set('two', {contents: new Buffer('zzz')});

        group
          .use(function(group) {
            group.options = {};
          })
          .use(function(group) {
            group.options.foo = 'bar';
          })
          .use(function() {
            this.set('one', 'two');
          });

        assert.equal(group.one, 'two');
        assert.equal(group.options.foo, 'bar');
      });
    });
  });

};
