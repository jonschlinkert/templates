'use strict';

var assert = require('assert');

module.exports = function(App, options, runner) {
  var app;

  var List = App.List;
  var Item = App.Item;
  var list;

  describe('list.use', function() {
    beforeEach(function() {
      list = new List();
    });

    it('should expose the instance to `use`:', function(cb) {
      list.use(function(inst) {
        assert(inst.isList);
        cb();
      });
    });

    it('should be chainable:', function(cb) {
      list.use(function(inst) {
        assert(inst.isList);
      })
        .use(function(inst) {
          assert(inst.isList);
        })
        .use(function(inst) {
          assert(inst.isList);
          cb();
        });
    });

    it('should expose the list to a plugin:', function() {
      list.use(function(items) {
        assert(items.isList);
        items.foo = items.addItem.bind(items);
      });

      list.foo('a', {content: '...'});
      assert(list.hasItem('a'));
    });

    it('should expose list when chained:', function() {
      list
        .use(function(items) {
          assert(items.isList);
          items.foo = items.addItem.bind(items);
        })
        .use(function(items) {
          assert(items.isList);
          items.bar = items.addItem.bind(items);
        })
        .use(function(items) {
          assert(items.isList);
          items.baz = items.addItem.bind(items);
        });

      var pages = list;

      pages.foo({path: 'a', content: '...'});
      pages.bar({path: 'b', content: '...'});
      pages.baz({path: 'c', content: '...'});

      assert(list.hasItem('a'));
      assert(list.hasItem('b'));
      assert(list.hasItem('c'));
    });

    it('should work when a custom `Item` constructor is passed:', function() {
      list = new List({Item: require('vinyl')});
      list
        .use(function(items) {
          assert(items.isList);
          items.foo = items.addItem.bind(items);
        })
        .use(function(items) {
          assert(items.isList);
          items.bar = items.addItem.bind(items);
        })
        .use(function(items) {
          assert(items.isList);
          items.baz = items.addItem.bind(items);
        });

      var pages = list;

      pages.foo({path: 'a', content: '...'});
      pages.bar({path: 'b', content: '...'});
      pages.baz({path: 'c', content: '...'});

      assert(list.hasItem('a'));
      assert(list.hasItem('b'));
      assert(list.hasItem('c'));
    });

    it('should pass to item `use` if a function is returned:', function() {
      list.use(function(items) {
        assert(items.isList);

        return function(item) {
          item.foo = items.addItem.bind(items);
          assert(item.isItem || item.isView);
        };
      });

      list.addItem('a', {content: '...'})
        .foo({path: 'b', content: '...'})
        .foo({path: 'c', content: '...'})
        .foo({path: 'd', content: '...'});

      assert(list.hasItem('a'));
      assert(list.hasItem('b'));
      assert(list.hasItem('c'));
      assert(list.hasItem('d'));
    });

    it('should be chainable when a item function is returned:', function() {
      list
        .use(function(items) {
          assert(items.isList);

          return function(item) {
            item.foo = items.addItem.bind(items);
            assert(item.isItem);
          };
        })
        .use(function(items) {
          assert(items.isList);

          return function(item) {
            item.bar = items.addItem.bind(items);
            assert(item.isItem);
          };
        })
        .use(function(items) {
          assert(items.isList);

          return function(item) {
            item.baz = items.addItem.bind(items);
            assert(item.isItem);
          };
        });

      list.addItem('a', {content: '...'})
        .foo({path: 'b', content: '...'})
        .bar({path: 'c', content: '...'})
        .baz({path: 'd', content: '...'});

      assert(list.hasItem('a'));
      assert(list.hasItem('b'));
      assert(list.hasItem('c'));
      assert(list.hasItem('d'));
    });
  });
};
