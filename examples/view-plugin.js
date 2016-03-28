var path = require('path');
var templates = require('../');
var app = templates();
app.initialize();

var View = app.View;
var Views = app.Views;
var List = app.List;

var collection = new Views();

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

function myPlugin(view) {
  view.sayFoo = function (str) {
    return str + '? no, foo!';
  };
}

var view = collection.getView('a/b/c/a.txt')
  .use(myPlugin);
console.log(view.sayFoo('bar'));
