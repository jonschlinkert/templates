'use strict';

var fs = require('fs');
var path = require('path');
var ent = require('ent');
var Remarkable = require('remarkable');
var utils = require('../lib/utils');
var templates = require('..');
var app = templates();

/**
 * Defin the engine to use
 */

app.engine('txt', require('engine-base'));
app.option('engine', 'txt');

/**
 * Create view collections
 */

app.create('pages');
app.create('layouts', {viewType: 'layout'});
app.create('headings', {viewType: 'partial'});

/**
 * Add some views
 */

// layout
app.layout('base', {content: '<div>{% body %}</div>'});

// headings
app.heading('h1', {content: '<h1><%= title %></h1>'});
app.heading('h2', {content: '<h2><%= title %></h2>'});
app.heading('h3', {content: '<h3><%= title %></h3>'});

// pages
app.page('three', {content: '<%= view("one") %>'});
app.page('two', {content: '<%= render(view("one")) %>'});
app.page('one', {
  content: '<%= heading("h1") %>\n<%= md(read("fixtures/post.md")) %>',
  layout: 'base'
});

/**
 * Define template helpers
 */

app.helper('read', function(fp) {
  return fs.readFileSync(fp, 'utf8');
});

app.helper('md', function(str, options) {
  var md = new Remarkable();
  var res = md.render(str, options);
  return ent.decode(res);
});

app.asyncHelper('render', function(view, context, cb) {
  if (typeof context === 'function') {
    cb = context;
    context = {};
  }

  if (typeof view === 'string') {
    view = app.view({content: view, path: 'string'});
  }

  if (!view) return cb(null, '');

  var ctx = utils.merge({}, this.context, context, view.ctx);
  view.compile();

  view.render(ctx, function(err, res) {
    if (err) return cb(err);
    cb(null, res.content);
  });
});

/**
 * Render a view
 */

app.render('two', {title: 'Home', name: 'Test!!!'}, function(err, res) {
  if (err) return console.log(err.stack);

  console.log(res.content);
});
