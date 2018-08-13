'use strict';

const symbol = Symbol.for('bench');
const fs = require('fs');
const path = require('path');
const mkdir = require('mkdirp');
const rimraf = require('rimraf');
const pretty = require('pretty-time');
const colors = require('ansi-colors');
const hbs = require('handlebars');
const write = require('write');
const Collection = require('../../lib/collection');
const engines = require('../../lib/engines');
const dirs = new Set();

/**
 * Render
 */

const { config, helpers, logger, parse, rename } = require('./setup');
const { paths } = config();
const log = logger('cyan');

/**
 * Render
 */

function render(destDir) {
  // delete existing files
  log.starting('delete existing files');
  rimraf.sync(path.join(__dirname, destDir || 'blog'));
  log.finished('delete existing files');

  let grand = process.hrtime();
  let total = log.time();
  let diff = log.time();
  log.starting('total build');

  // read posts
  log.starting('read blog posts');
  const files = fs.readdirSync(paths.cwd());
  log.finished('read blog posts', diff());

  // start build
  log.starting('assemble - build');
  let assembled = log.time();

  // collection
  log.starting('assemble - create collection');
  const collection = new Collection('pages');

  collection.engine('hbs', engines(hbs));
  collection.option('engine', 'hbs');

  // register helpers
  helpers(collection);

  log.finished('assemble - create collection', diff());

  // parse front matter and add views
  log.starting('assemble - add views and parse front-matter', diff());
  for (const filename of files) {
    if (/\.md$/.test(filename)) {
      const view = collection.set(parse({ path: paths.cwd(filename), cwd: paths.cwd() }));
      view[symbol] = {};
      rename(view, paths.destBase);
    }
  }
  log.finished('assemble - add views and parse front-matter', diff());

  const tags = collection.collect('tags', { singular: 'tag' });

  // paginate views
  log.starting('assemble - paginate views');
  collection.pager({
    sort(items) {
      return items.sort((a, b) => a.path.localeCompare(b.path));
    }
  });

  collection.paginate(page => {
    const view = collection.set(page);
    view[symbol] = view[symbol] || {};
    view.path = paths.cwd(view.relative);
    view.base = paths.cwd();
    view.cwd = paths.cwd();
    view.contents = Buffer.from(`
<h1>Posts</h1>
<ul>
  {{#each pagination.items}}
  <li><a href="{{path}}">{{data.slug}} > {{data.description}} ({{data.date}})</a></li>
  {{/each}}
</ul>

  <a href="{{pagerFirst pager "path"}}">First</a>
  <a href="{{pagerPrev pager "path"}}">Prev</a>
  <a>{{pager.number}}</a>
  <a href="{{pagerNext pager "path"}}">Next</a>
  <a href="{{pagerLast pager "path"}}">Last</a>
  `);
    rename(view, paths.destBase);
    return view;
  });

  log.finished('assemble - paginate views', diff());

  tags.items.forEach(item => {
    item[symbol] = item[symbol] || {};
    item.key = item.path;
    collection.set(item);
    item.contents = Buffer.from(`
  <h1>Posts with the tag: {{tag}}</h1>
  <ul>
    {{#each pagination.items}}
    <li><a href="{{path}}">{{data.slug}} > {{data.description}} ({{data.date}})</a></li>
    {{/each}}
  </ul>

    <a href="{{pagerFirst pager "path"}}">First</a>
    <a href="{{pagerPrev pager "path"}}">Prev</a>
    <a>{{pager.number}}</a>
    <a href="{{pagerNext pager "path"}}">Next</a>
    <a href="{{pagerLast pager "path"}}">Last</a>
    `);
    item.path = paths.cwd(item.relative);
    item.base = paths.cwd();
    item.cwd = paths.cwd();
    rename(item, paths.destBase);
  });

  for (const key of Object.keys(tags.paths)) {
    tags.paths[key] = paths.destBase(tags.paths[key]);
  }

  // render views
  log.starting('assemble - render views');
  for (const [, view] of collection.views) {
    collection.render(view, { site: { paths: { root: paths.destBase() }, tags }});
  }
  log.finished('assemble - render views', diff());

  // write files
  log.starting('assemble - write rendered views to fs');
  let i = 0;
  for (const [, view] of collection.views) {
    if (!dirs.has(view.dirname)) {
      dirs.add(view.dirname);
      mkdir(view.dirname);
    }
    rename(view, paths.destBase);
    write.sync(view.path, view.contents);
    i++;
  }

  log.finished('assemble - write rendered views to fs', diff());
  log.finished('assemble - build', assembled());
  log.finished(`total build (generated ${i} pages)`, total());
  log.finished('per view:', colors.green(pretty(log.ns(process.hrtime(grand)) / i, 2)));
}

module.exports = render;
