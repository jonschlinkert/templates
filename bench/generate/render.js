'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const mkdir = require('mkdirp');
const rimraf = require('rimraf');
const pretty = require('pretty-time');
const colors = require('ansi-colors');
const write = require('write');
const Collection = require('../../lib/collection');
const cwd = path.join.bind(path, __dirname, 'blog');
const dirs = new Set();

const time = function() {
  let start = process.hrtime();
  return () => {
    let diff = process.hrtime(start);
    start = process.hrtime();
    return colors.magenta(pretty(diff, 'μs'));
  };
}

function ns(n) {
  return n[0] * 1e9 + n[1];
}

const starting = (name, ...rest) => {
  console.log('starting:', colors.cyan(name), ...rest);
};
const finished = (name, ...rest) => {
  console.log('finished:', colors.cyan(name), ...rest);
};

function render(destDir) {
  // delete existing files
  starting('delete existing files');
  rimraf.sync(path.join(__dirname, destDir || 'dist'));
  finished('delete existing files');

  let grand = process.hrtime();
  let total = time();
  let diff = time();
  starting('total build');

  // read posts
  starting('read blog posts');
  const files = fs.readdirSync(cwd());
  finished('read blog posts', diff());

  // start build
  starting('assemble - build');
  let assembled = time();

  // collection
  starting('assemble - create collection');
  const collection = new Collection('pages', { sync: true });
  collection.option('engine', 'noop');
  finished('assemble - create collection', diff());

  // parse front matter and add views
  starting('assemble - add views and parse front-matter', diff());
  for (const filename of files) {
    if (/\.md$/.test(filename)) {
      collection.set(parse({ path: cwd(filename), cwd: cwd() }));
    }
  }
  finished('assemble - add views and parse front-matter', diff());

  // render views
  starting('assemble - render views');
  for (const [key, view] of collection.views) {
    collection.render(view);
  }
  finished('assemble - render views', diff());

  // write files
  starting('assemble - write rendered views to fs');
  for (const [key, view] of collection.views) {
    if (!dirs.has(view.dirname)) {
      dirs.add(view.dirname);
      mkdir(view.dirname);
    }
    rename(view);
    write.sync(view.path, view.contents);
  }

  finished('assemble - write rendered views to fs', diff());
  finished('assemble - build', assembled());
  finished('total build (generated 5,000 blog posts)', total());
  console.log('per view:', colors.green(pretty(ns(process.hrtime(grand)) / 5000)));
}

function parse(file) {
  const str = fs.readFileSync(file.path, 'utf8');
  const idx = str.indexOf('---', 4);
  if (str.slice(0, 3) === '---' && idx !== -1) {
    const matter = str.slice(3, idx);
    file.matter = Buffer.from(matter);
    file.data = JSON.parse(matter);
    file.contents = Buffer.from(str.slice(idx + 4));
  } else {
    file.data = {};
    file.contents = Buffer.from(str);
  }
  return file;
}

function rename(view) {
  view.extname = path.extname(view.path);
  view.stem = path.basename(view.path, view.extname);
  view.basename = view.stem + '.html';
  view.path = path.join(__dirname, 'dist', view.basename);
  // view.path = path.join(__dirname, 'dist', dest(view));
  view.dirname = path.dirname(view.path);
}

function dest(file) {
  const pad = str => str.padStart(2, '0');
  const regex = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.*?)\.(md|html)/;
  const match = regex.exec(file.basename) || [];
  const [ year, month, day, slug, ext ] = match.slice(1);
  return `${year}/${pad(month)}/${pad(day)}/${slug}.html`;
}

render();
