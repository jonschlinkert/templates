'use strict';

var path = require('path');
var assert = require('assert');
var fixtures = path.resolve.bind(path, __dirname, 'fixtures');
var support = require('./support');
var hasProperties = support.hasProperties;

module.exports = function(App, options, runner) {
  var app;

  function renameKey(key) {
    return path.basename(key, path.extname(key));
  }

  describe('renameKey', function() {
    beforeEach(function() {
      app = new App();
      app.engine('tmpl', require('engine-base'));
      app.create('pages');
      app.create('posts');
    });

    describe('global options:', function() {
      it('should use `renameKey` function defined on global opts:', function() {
        app.option('renameKey', renameKey);

        app.posts('a/b/c/a.txt', {content: '...'});
        app.posts('a/b/c/b.txt', {content: '...'});
        app.posts('a/b/c/c.txt', {content: '...'});
        app.post('a/b/c/d.txt', {content: '...'});
        app.post('a/b/c/e.txt', {content: '...'});

        assert(app.views.posts.hasOwnProperty('a'));
        assert(app.views.posts.hasOwnProperty('b'));
        assert(app.views.posts.hasOwnProperty('c'));
        assert(app.views.posts.hasOwnProperty('d'));
        assert(app.views.posts.hasOwnProperty('e'));
      });

      it('should expose `view` when defined on global opts:', function() {
        app.option('renameKey', function(key, view) {
          return view.filename;
        });

        app.posts('a/b/c/a.txt', {content: '...'});
        app.posts('a/b/c/b.txt', {content: '...'});
        app.posts('a/b/c/c.txt', {content: '...'});
        app.post('a/b/c/d.txt', {content: '...'});
        app.post('a/b/c/e.txt', {content: '...'});

        assert(app.views.posts.hasOwnProperty('a'));
        assert(app.views.posts.hasOwnProperty('b'));
        assert(app.views.posts.hasOwnProperty('c'));
        assert(app.views.posts.hasOwnProperty('d'));
        assert(app.views.posts.hasOwnProperty('e'));
      });

      it('should not have conflicts when view name is the collection name:', function() {
        app.option('renameKey', renameKey);

        app.post('a/b/c/post.txt', {content: 'this is contents'});
        app.page('a/b/c/page.txt', {content: 'this is contents'});

        assert(app.views.posts.hasOwnProperty('post'));
        assert(app.views.pages.hasOwnProperty('page'));
      });
    });

    describe('create method:', function() {
      it('should use `renameKey` option chained from the `create` method:', function() {
        app.create('post')
          .option('renameKey', function(key) {
            return 'posts/' + path.basename(key);
          });

        app.posts('a/b/c/a.txt', {content: '...'});
        app.posts('a/b/c/b.txt', {content: '...'});
        app.posts('a/b/c/c.txt', {content: '...'});
        app.post('a/b/c/d.txt', {content: '...'});
        app.post('a/b/c/e.txt', {content: '...'});

        assert(app.views.posts.hasOwnProperty('posts/a.txt'));
        assert(app.views.posts.hasOwnProperty('posts/b.txt'));
        assert(app.views.posts.hasOwnProperty('posts/c.txt'));
        assert(app.views.posts.hasOwnProperty('posts/d.txt'));
        assert(app.views.posts.hasOwnProperty('posts/e.txt'));
      });
    });

    describe('create method:', function() {
      it('should use `renameKey` defined on the `create` method:', function() {
        app.create('post', {
          renameKey: function(key) {
            return 'posts/' + path.basename(key);
          }
        });

        app.posts('a/b/c/a.txt', {content: '...'});
        app.posts('a/b/c/b.txt', {content: '...'});
        app.posts('a/b/c/c.txt', {content: '...'});
        app.post('a/b/c/d.txt', {content: '...'});
        app.post('a/b/c/e.txt', {content: '...'});

        assert(app.views.posts.hasOwnProperty('posts/a.txt'));
        assert(app.views.posts.hasOwnProperty('posts/b.txt'));
        assert(app.views.posts.hasOwnProperty('posts/c.txt'));
        assert(app.views.posts.hasOwnProperty('posts/d.txt'));
        assert(app.views.posts.hasOwnProperty('posts/e.txt'));
      });

      it('should expose `view` as the second argument', function() {
        app.create('post', {
          renameKey: function(key, view) {
            return 'posts/' + view.basename;
          }
        });

        app.posts('a/b/c/a.txt', {content: '...'});
        app.posts('a/b/c/b.txt', {content: '...'});
        app.posts('a/b/c/c.txt', {content: '...'});
        app.post('a/b/c/d.txt', {content: '...'});
        app.post('a/b/c/e.txt', {content: '...'});

        assert(app.views.posts.hasOwnProperty('posts/a.txt'));
        assert(app.views.posts.hasOwnProperty('posts/b.txt'));
        assert(app.views.posts.hasOwnProperty('posts/c.txt'));
        assert(app.views.posts.hasOwnProperty('posts/d.txt'));
        assert(app.views.posts.hasOwnProperty('posts/e.txt'));
      });
    });

    describe('collections:', function() {
      describe('setting:', function() {
        it('should get a view with the `renameKey` defined on app.options:', function() {
          app.option('renameKey', function(key) {
            return 'foo/' + path.basename(key);
          });

          app.posts('a/b/c/a.txt', {content: '...'});
          app.posts('a/b/c/b.txt', {content: '...'});
          app.post('a/b/c/c.txt', {content: '...'});

          assert(app.views.posts.hasOwnProperty('foo/a.txt'));
          assert(app.views.posts.hasOwnProperty('foo/b.txt'));
          assert(app.views.posts.hasOwnProperty('foo/c.txt'));
        });

        it('should use `renameKey` defined on collection.options:', function() {
          app.pages.option('renameKey', function(key) {
            return 'page/' + path.basename(key);
          });

          app.posts.option('renameKey', function(key) {
            return 'post/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          app.posts('a/b/c/a.txt', {content: '...'});
          app.posts('a/b/c/b.txt', {content: '...'});
          app.posts('a/b/c/c.txt', {content: '...'});
          app.post('a/b/c/d.txt', {content: '...'});
          app.post('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('page/a.txt'));
          assert(app.views.pages.hasOwnProperty('page/b.txt'));
          assert(app.views.pages.hasOwnProperty('page/c.txt'));
          assert(app.views.pages.hasOwnProperty('page/d.txt'));
          assert(app.views.pages.hasOwnProperty('page/e.txt'));

          assert(app.views.posts.hasOwnProperty('post/a.txt'));
          assert(app.views.posts.hasOwnProperty('post/b.txt'));
          assert(app.views.posts.hasOwnProperty('post/c.txt'));
          assert(app.views.posts.hasOwnProperty('post/d.txt'));
          assert(app.views.posts.hasOwnProperty('post/e.txt'));
        });

        it('should expose `view` when defined on collection.options:', function() {
          app.pages.option('renameKey', function(key, view) {
            return 'page/' + view.basename;
          });

          app.posts.option('renameKey', function(key, view) {
            return 'post/' + view.basename;
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          app.posts('a/b/c/a.txt', {content: '...'});
          app.posts('a/b/c/b.txt', {content: '...'});
          app.posts('a/b/c/c.txt', {content: '...'});
          app.post('a/b/c/d.txt', {content: '...'});
          app.post('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('page/a.txt'));
          assert(app.views.pages.hasOwnProperty('page/b.txt'));
          assert(app.views.pages.hasOwnProperty('page/c.txt'));
          assert(app.views.pages.hasOwnProperty('page/d.txt'));
          assert(app.views.pages.hasOwnProperty('page/e.txt'));

          assert(app.views.posts.hasOwnProperty('post/a.txt'));
          assert(app.views.posts.hasOwnProperty('post/b.txt'));
          assert(app.views.posts.hasOwnProperty('post/c.txt'));
          assert(app.views.posts.hasOwnProperty('post/d.txt'));
          assert(app.views.posts.hasOwnProperty('post/e.txt'));
        });

        it('should use the `collection.renameKey()` method:', function() {
          app.pages.renameKey(function(key) {
            return 'baz/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('baz/a.txt'));
          assert(app.views.pages.hasOwnProperty('baz/b.txt'));
          assert(app.views.pages.hasOwnProperty('baz/c.txt'));
          assert(app.views.pages.hasOwnProperty('baz/d.txt'));
          assert(app.views.pages.hasOwnProperty('baz/e.txt'));
        });

        it('should expose `view` with the `collection.renameKey()` method:', function() {
          app.pages.renameKey(function(key, view) {
            return 'baz/' + view.basename;
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('baz/a.txt'));
          assert(app.views.pages.hasOwnProperty('baz/b.txt'));
          assert(app.views.pages.hasOwnProperty('baz/c.txt'));
          assert(app.views.pages.hasOwnProperty('baz/d.txt'));
          assert(app.views.pages.hasOwnProperty('baz/e.txt'));
        });

        it('should use the `app.renameKey()` method:', function() {
          app.renameKey(function(key) {
            return 'app/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('app/a.txt'));
          assert(app.views.pages.hasOwnProperty('app/b.txt'));
          assert(app.views.pages.hasOwnProperty('app/c.txt'));
          assert(app.views.pages.hasOwnProperty('app/d.txt'));
          assert(app.views.pages.hasOwnProperty('app/e.txt'));
        });

        it('should expose `view` with the `app.renameKey()` method:', function() {
          app.renameKey(function(key, view) {
            return 'app/' + view.basename;
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('app/a.txt'));
          assert(app.views.pages.hasOwnProperty('app/b.txt'));
          assert(app.views.pages.hasOwnProperty('app/c.txt'));
          assert(app.views.pages.hasOwnProperty('app/d.txt'));
          assert(app.views.pages.hasOwnProperty('app/e.txt'));
        });

        it('should prefer collection method over app.options:', function() {
          // this works when you switch the order around...
          app.pages.renameKey(function pagesRenameKey(key) {
            return 'aaa/' + path.basename(key);
          });
          app.option('renameKey', function optsRenameKey(key) {
            return 'foo/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('aaa/a.txt'));
          assert(app.views.pages.hasOwnProperty('aaa/b.txt'));
          assert(app.views.pages.hasOwnProperty('aaa/c.txt'));
          assert(app.views.pages.hasOwnProperty('aaa/d.txt'));
          assert(app.views.pages.hasOwnProperty('aaa/e.txt'));
        });

        it('should prefer collection method over app method:', function() {
          app.pages.renameKey(function(key) {
            return 'aaa/' + path.basename(key);
          });
          app.renameKey(function(key) {
            return 'zzz/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('aaa/a.txt'));
          assert(app.views.pages.hasOwnProperty('aaa/b.txt'));
          assert(app.views.pages.hasOwnProperty('aaa/c.txt'));
          assert(app.views.pages.hasOwnProperty('aaa/d.txt'));
          assert(app.views.pages.hasOwnProperty('aaa/e.txt'));
        });

        it('should prefer collection options over app.options:', function() {
          app.pages.option('renameKey', function(key) {
            return 'collection/' + path.basename(key);
          });
          app.option('renameKey', function(key) {
            return 'app/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('collection/a.txt'));
          assert(app.views.pages.hasOwnProperty('collection/b.txt'));
          assert(app.views.pages.hasOwnProperty('collection/c.txt'));
          assert(app.views.pages.hasOwnProperty('collection/d.txt'));
          assert(app.views.pages.hasOwnProperty('collection/e.txt'));
        });

        it('should prefer collection options over app method:', function() {
          app.pages.option('renameKey', function(key) {
            return 'collection/' + path.basename(key);
          });
          app.renameKey(function(key) {
            return 'app/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.pages('a/b/c/c.txt', {content: '...'});
          app.page('a/b/c/d.txt', {content: '...'});
          app.page('a/b/c/e.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('collection/a.txt'));
          assert(app.views.pages.hasOwnProperty('collection/b.txt'));
          assert(app.views.pages.hasOwnProperty('collection/c.txt'));
          assert(app.views.pages.hasOwnProperty('collection/d.txt'));
          assert(app.views.pages.hasOwnProperty('collection/e.txt'));
        });

        it('should use renameKey on chained methods:', function() {
          app.page(fixtures('pages/a.txt'), {
            options: {
              renameKey: function foo(key) {
                return 'foo/' + path.basename(key);
              }
            }
          });

          app.page(fixtures('pages/a.hbs'), {
            options: {
              renameKey: function bar(key) {
                return 'bar/' + path.basename(key);
              }
            }
          });

          hasProperties(app.views.pages, [
            'foo/a.txt',
            'bar/a.hbs'
          ]);
        });
      });

      describe('getting', function() {
        beforeEach(function() {
          app = new App();
          app.engine('tmpl', require('engine-base'));
          app.create('post');
          app.create('page');
        });

        it('should get a view with the `renameKey` defined on the `create` method:', function() {
          app.create('post', {
            renameKey: function createRenameKey(key) {
              return 'posts/' + path.basename(key);
            }
          });

          app.posts('a/b/c/a.txt', {content: '...'});
          app.posts('a/b/c/b.txt', {content: '...'});
          app.post('a/b/c/c.txt', {content: '...'});

          assert.equal(app.posts.getView('a.txt').path, 'a/b/c/a.txt');
          assert.equal(app.posts.getView('posts/a.txt').path, 'a/b/c/a.txt');
        });

        it('should get a view with `renameKey` on collection.options:', function() {
          app.pages.option('renameKey', function(key) {
            return 'bar/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.page('a/b/c/c.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('bar/a.txt'));
          assert(app.views.pages.hasOwnProperty('bar/b.txt'));
          assert(app.views.pages.hasOwnProperty('bar/c.txt'));
        });

        it('should get a view with the the `app.renameKey()` method:', function() {
          app.renameKey(function(key) {
            return 'baz/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.page('a/b/c/c.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('baz/a.txt'));
          assert(app.views.pages.hasOwnProperty('baz/b.txt'));
          assert(app.views.pages.hasOwnProperty('baz/c.txt'));
        });

        it('should get a view with the the `collection.renameKey()` method:', function() {
          app.pages.renameKey(function(key) {
            return 'baz/' + path.basename(key);
          });

          app.pages('a/b/c/a.txt', {content: '...'});
          app.pages('a/b/c/b.txt', {content: '...'});
          app.page('a/b/c/c.txt', {content: '...'});

          assert(app.views.pages.hasOwnProperty('baz/a.txt'));
          assert(app.views.pages.hasOwnProperty('baz/b.txt'));
          assert(app.views.pages.hasOwnProperty('baz/c.txt'));
        });
      });
    });
  });
};
