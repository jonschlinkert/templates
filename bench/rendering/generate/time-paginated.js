'use strict';

const symbol = Symbol('bench');
const fs = require('fs');
const path = require('path');
const util = require('util');
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
  rimraf.sync(path.join(__dirname, destDir || 'blog'));
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

  collection.engine('hbs', engine(hbs));
  collection.option('engine', 'hbs');

  collection.helper('array', function(arr, i) {
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

  collection.helper('pagerFirst', function(pager, prop) {
    let item = pager ? pager.items[0] : null;
    if (item) {
      return prop ? get(item, prop) : item;
    }
    return '';
  });

  collection.helper('pagerLast', function(pager, prop) {
    let item = pager ? pager.items[pager.items.length - 1] : null;
    if (item) {
      return prop ? get(item, prop) : item;
    }
    return '';
  });

  collection.helper('pagerPrev', function(pager, prop) {
    if (!pager) return '';
    let item = pager.items[pager.prev.index];
    if (item) {
      return prop ? get(item, prop) : item;
    }
  });

  collection.helper('pagerCurrent', function(pager, prop) {
    if (!pager) return '';
    let item = pager.items[pager.index];
    if (item) {
      return prop ? get(item, prop) : item;
    }
  });

  collection.helper('pagerNext', function(pager, prop) {
    if (!pager) return '';
    let item = pager.items[pager.next.index];
    if (item) {
      return prop ? get(item, prop) : item;
    }
  });

  collection.helper('prevPath', function(pager) {
    let prev = pager.items[pager.prev.index];
    if (prev) {
      return prev.path;
    }
  });

  collection.helper('nextPath', function(pager) {
    let next = pager.items[pager.next.index];
    if (next) {
      return next.path;
    }
  });

  collection.helper('filter', function(obj = {}, arr = []) {
    const res = {};
    for (const key of Object.keys(obj)) {
      if (arr.includes(key)) {
        res[key] = obj[key];
      }
    }
    return res;
  });

  finished('assemble - create collection', diff());

  // parse front matter and add files
  starting('assemble - add files and parse front-matter', diff());
  for (const filename of files) {
    if (/\.md$/.test(filename)) {
      const file = collection.set(parse({ path: cwd(filename), cwd: cwd() }));
      file[symbol] = {};
      rename(file);
    }
  }
  finished('assemble - add files and parse front-matter', diff());

  const tags = collection.collect('tags', { singular: 'tag' });

  // paginate files
  starting('assemble - paginate files');
  collection.pager({
    sort(items) {
      return items.sort((a, b) => a.path.localeCompare(b.path));
    }
  });

  collection.paginate(page => {
    const file = collection.set(page);
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
    item.path = cwd(item.relative);
    item.base = cwd();
    item.cwd = cwd();
    // console.log(item.data)
    rename(item);
  });

  for (const key of Object.keys(tags.paths)) {
    tags.paths[key] = destBase(tags.paths[key]);
  }

  // render files
  starting('assemble - render files');
  for (const [key, file] of collection.files) {
    collection.render(file, { site: { paths: { root: destBase() }, tags }});
  }
  finished('assemble - render files', diff());

  // write files
  starting('assemble - write rendered files to fs');
  let i = 0;
  for (const [key, file] of collection.files) {
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

function rename(file) {
  file.extname = path.extname(file.path);
  file.stem = path.basename(file.path, file.extname);
  file.basename = file.stem + '.html';
  file.path = destBase(dest(file));
  file.dirname = path.dirname(file.path);
}

function dest(file, options = {}) {
  const pad = str => str.padStart(2, '0');
  const regex = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.*?)\.(md|html)/;
  const match = regex.exec(file.basename);
  if (!match) return file.relative;
  const [ year, month, day, slug, ext ] = match.slice(1);
  return `${year}/${pad(month)}/${pad(day)}/${slug}.html`;
}

function setSymbol(file) {
  file[symbol] = file[symbol] || {};
}

render();
