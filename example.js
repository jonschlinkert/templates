var path = require('path');
var View = require('./lib/view');
var Views = require('./lib/views');
var List = require('./lib/list');
var App = require('./');

var helpers = require('template-helpers');
helpers._.log = console.log.bind(console);
helpers._.base = '_gh_pages/blog';
helpers._.relative = path.relative.bind(path);

var collection = new Views();
var index = new View({
  data: helpers._,
  // index stuff
  // content: '{{#items}}{{log .}}{{/items}}'
  contents: new Buffer(
    [
      '<%= dest %>',
      '<% map(items, function(item) { %>',
      ' <a href="<%= relative(dest, item.locals.base + "/" + item.path) %>"><%= item.content %></a>',
      '<% }) %>',
      '<% if (typeof next !== "undefined") { %><a href="<%= relative(dest, next.data.dest) %>">Next</a><% } %>'
    ].join('\n')
  )
});

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

var pagination = require('./pagination');
var list = new List(collection)
  .use(pagination({limit: 4, first: 0}))

// console.log(list)

var pages = new Views();
pages.addList(list.paginate(index));

Object.keys(pages.views).forEach(function (key) {
  var page = pages.views[key];
  page.data.dest = path.join(page.data.base, page.path);
});

Object.keys(pages.views).forEach(function (key) {
  var page = pages.views[key];

  page.render(function (err, view) {
    if (err) return console.error(err);
    console.log(view.contents.toString());
  });
});
