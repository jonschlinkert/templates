'use strict';

const symbol = Symbol.for('bench');
const fs = require('fs');
const path = require('path');
const mkdir = require('mkdirp');
const rimraf = require('rimraf');
const pretty = require('pretty-time');
const colors = require('ansi-colors');
const write = require('write');
const Collection = require('../../lib/collection');
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
  log.starting('deleted');
  rimraf.sync(path.join(__dirname, destDir || 'blog'));
  log.finished('deleted', 'rendered posts from previous build');

  let grand = process.hrtime();

  // read posts
  log.starting('loaded');
  const files = fs.readdirSync(paths.cwd());
  log.finished('loaded', `${files.length} markdown files`);

  // start build
  log.starting('generated');

  // collection
  log.starting('created');
  const collection = new Collection('pages');

  collection.option('engine', 'noop');
  helpers(collection);
  log.finished('created', 'posts collection');

  // parse front matter and add views
  log.starting('parsed');
  for (const basename of files) {
    if (/\.md$/.test(basename)) {
      const filepath = paths.cwd(basename);
      const view = collection.set(parse({ path: filepath, cwd: paths.cwd() }));
      view[symbol] = {};
      rename(view, paths.destBase);
    }
  }
  log.finished('parsed', 'front-matter');

  // render views
  log.starting('rendered');
  for (const [, view] of collection.views) {
    collection.render(view, { site: { paths: { root: paths.destBase() } }});
  }
  log.finished('rendered', `all posts`);

  // write files
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

  let relative = path.relative(__dirname, paths.destBase());
  log.finished('generated', `blog in "./${relative}" with ${i.toLocaleString()} pages`);
  const t = pretty(log.ns(process.hrtime(grand)) / i, 2);
  console.log(colors.green(`average of ${t} per page`));
}

module.exports = render;
