'use strict';

var fs = require('fs');
var path = require('path');
var ent = require('ent');
var Remarkable = require('remarkable');
var merge = require('mixin-deep');
var utils = require('../lib/utils');
var templates = require('..');
var app = templates();

app.engine('text', require('engine-base'));
app.create('pages', {engine: 'text'});
app.create('partials', {viewType: 'partial', engine: 'text'});

app.page('home', {content: '<%= partial("foo") %>\n<%= render(md(read("fixtures/post.md"))) %>'});
// app.page('two', {content: '<%= view("home", {render: "false"}) %>'});
app.page('two', {content: '<%= view("home") %>'});

app.partial('foo', {content: 'this is <%= title %>'});
app.partial('bar', {content: 'this is <%= title %>'});
app.partial('baz', {content: 'this is <%= title %>'});

app.helper('read', function(fp) {
  return fs.readFileSync(fp, 'utf8');
});

app.helper('md', function(str, options) {
  var md = new Remarkable();
  var res = md.render(str, options);
  return ent.decode(res);
});

app.asyncHelper('render', function(str, context, cb) {
  if (typeof context === 'function') {
    cb = context;
    context = {};
  }

  // var view;
  // if (utils.isObject(str) && (str.isView || str.isItem)) {
  //   view = str;
  // } else {
  //   view = this.app.view({path: 'n/a', content: str});
  // }

  var ctx = merge({}, this.context, context);
  this.app.renderString(str, ctx, function(err, res) {
    if (err) return cb(err);
    cb(null, res.content);
  });
});


app.render('two', {title: 'Home', name: 'Test!!!'}, function(err, res) {
  if (err) return console.log(err);

  console.log(res.content);
});
