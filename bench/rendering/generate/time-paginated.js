'use strict';

const symbol = Symbol('bench');
const fs = require('fs');
const path = require('path');
const get = require('get-value');
const mkdir = require('mkdirp');
const rimraf = require('rimraf');
const pretty = require('pretty-time');
const colors = require('ansi-colors');
const write = require('write');
const hbs = require('handlebars');
const engine = require('engine-handlebars');
const Collection = require('../../../lib/collection');
const cwd = path.join.bind(path, __dirname, 'content');
const destBase = path.join.bind(path, __dirname, 'blog');
const dirs = new Set();
let start;

const time = function() {
  let start = process.hrtime();
  return () => {
    let diff = process.hrtime(start);
    start = process.hrtime();
    return colors.magenta(pretty(diff, 'μs'));
  };
};

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
  rimraf.sync(path.join(__dirname, destDir || 'blog'));
  finished('delete existing files');

  let grand = process.hrtime();
  let total = time();
  let diff = time();
  start = Date.now();
  starting('total build');

  // read posts
  starting('read blog posts');
  let files = fs.readdirSync(cwd());
  finished('read blog posts', diff());

  // start build
  starting('assemble - build');
  let assembled = time();

  // pages
  starting('assemble - create pages');
  let pages = new Collection('pages', { type: 'renderable', sync: true });

  pages.engine(['hbs', 'md', 'html'], engine(hbs));
  pages.option('engine', 'hbs');

  pages.helper('array', function(arr, i) {
    if (/^[0-9]+$/.test(i)) {
      return arr[i];
    }
    if (i === 'first') {
      return arr[0];
    }
    if (i === 'last') {
      return arr[arr.length - 1];
    }
  });

  pages.helper('pagerFirst', (pager, prop) => {
    let item = pager ? pager.items[0] : null;
    if (item) {
      return prop ? get(item, prop) : item;
    }
    return '';
  });

  pages.helper('pagerLast', (pager, prop) => {
    let item = pager ? pager.items[pager.items.length - 1] : null;
    if (item) {
      return prop ? get(item, prop) : item;
    }
    return '';
  });

  pages.helper('pagerPrev', function(pager, prop) {
    if (!pager) return '';
    let item = pager.items[pager.prev.index];
    if (item) {
      return prop ? get(item, prop) : item;
    }
  });

  pages.helper('pagerCurrent', (pager, prop) => {
    if (!pager) return '';
    let item = pager.items[pager.index];
    if (item) {
      return prop ? get(item, prop) : item;
    }
  });

  pages.helper('pagerNext', (pager, prop) => {
    if (!pager) return '';
    let item = pager.items[pager.next.index];
    if (item) {
      return prop ? get(item, prop) : item;
    }
  });

  pages.helper('prevPath', pager => {
    let prev = pager.items[pager.prev.index];
    if (prev) {
      return prev.path;
    }
  });

  pages.helper('nextPath', pager => {
    let next = pager.items[pager.next.index];
    if (next) {
      return next.path;
    }
  });

  pages.helper('filter', (obj = {}, arr = []) => {
    let res = {};
    for (let key of Object.keys(obj)) {
      if (arr.includes(key)) {
        res[key] = obj[key];
      }
    }
    return res;
  });

  finished('assemble - create pages', diff());

  // parse front matter and add files
  starting('assemble - add files and parse front-matter');
  for (let filename of files) {
    if (/\.md$/.test(filename)) {
      let file = pages.set(parse({ path: cwd(filename), cwd: cwd() }));
      file[symbol] = {};
      rename(file);
    }
  }

  finished('assemble - add files and parse front-matter', diff());
  let tags = pages.collect('tags', { singular: 'tag' });

  // paginate files
  starting('assemble - paginate files');
  pages.pager({
    sort(items) {
      return items.sort((a, b) => a.path.localeCompare(b.path));
    }
  });

  pages.paginate(page => {
    let file = pages.set(page);
    file.path = cwd(file.relative);
    file.base = cwd();
    file.cwd = cwd();
    file.contents = Buffer.from(`
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
    rename(file);
    return file;
  });

  finished('assemble - paginate files', diff());

  tags.items.forEach(item => {
    item.key = item.path;
    pages.set(item);
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
    item.path = cwd(item.relative);
    item.base = cwd();
    item.cwd = cwd();
    rename(item);
  });

  for (let key of Object.keys(tags.paths)) {
    tags.paths[key] = destBase(tags.paths[key]);
  }

  // render files
  starting('assemble - render files');
  for (let [, file] of pages.files) {
    pages.render(file, { site: { paths: { root: destBase() }, tags }});
  }

  finished('assemble - render files', diff());

  // write files
  starting('assemble - write rendered files to fs');

  let i = 0;
  for (let [, file] of pages.files) {
    if (!dirs.has(file.dirname)) {
      dirs.add(file.dirname);
      mkdir(file.dirname);
    }
    rename(file);
    write.sync(file.path, file.contents);
    i++;
  }

  finished('assemble - write rendered files to fs', diff());
  finished('assemble - build', assembled());
  finished(`total build (generated ${i} pages)`, total());
  console.log('per file:', colors.green(pretty(ns(process.hrtime(grand)) / i, 2)));
}

function parse(file) {
  let str = fs.readFileSync(file.path, 'utf8');
  let idx = str.indexOf('---', 4);
  if (str.slice(0, 3) === '---' && idx !== -1) {
    let matter = str.slice(3, idx);
    file.matter = Buffer.from(matter);
    file.data = JSON.parse(matter);
    file.contents = Buffer.from(str.slice(idx + 4));
  } else {
    file.data = {};
    file.contents = Buffer.from(str);
  }
  return file;
}

function rename(file) {
  file.extname = path.extname(file.path);
  file.stem = path.basename(file.path, file.extname);
  file.basename = file.stem + '.html';
  file.path = destBase(dest(file));
  file.dirname = path.dirname(file.path);
}

function dest(file, options = {}) {
  let pad = str => str.padStart(2, '0');
  let regex = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.*?)\.(md|html)/;
  let match = regex.exec(file.basename);
  if (!match) return file.relative;
  let [ year, month, day, slug ] = match.slice(1);
  return `${year}/${pad(month)}/${pad(day)}/${slug}.html`;
}

render();
