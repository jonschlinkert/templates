var path = require('path');
var Templates = require('../');
var app = new Templates();

var View = app.View;
var Views = app.Views;
var List = app.List;

var collection = new Views()
  .use(myPlugin())

collection.addViews({
  'a/b/c/a.txt': {locals: {base: '_gh_pages/blog'}, content: 'aaa'},
  'a/b/c/b.txt': {locals: {base: '_gh_pages/blog'}, content: 'bbb'},
  'a/b/c/c.txt': {locals: {base: '_gh_pages/blog'}, content: 'ccc'},
  'a/b/c/d.txt': {locals: {base: '_gh_pages/blog'}, content: 'ddd'},
  'a/b/c/e.txt': {locals: {base: '_gh_pages/blog'}, content: 'eee'},
  'a/b/c/f.txt': {locals: {base: '_gh_pages/blog'}, content: 'fff'},
  'a/b/c/g.txt': {locals: {base: '_gh_pages/blog'}, content: 'ggg'},
  'a/b/c/h.txt': {locals: {base: '_gh_pages/blog'}, content: 'hhh'},
  'a/b/c/i.txt': {locals: {base: '_gh_pages/blog'}, content: 'iii'},
  'a/b/c/j.txt': {locals: {base: '_gh_pages/blog'}, content: 'jjj'},
});

function myPlugin() {
  return function(collection) {
    collection.match = function(re) {
      for (var key in collection.views) {
        if (re.test(key)) return collection.views[key];
      }
    };

    return function(view) {
      view.upper = function() {
        return view.content.toUpperCase();
      };
      return view;
    };
  };
}

var view = collection.match(/a\.txt$/);
console.log(view.upper());
