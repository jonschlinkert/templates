'use strict';

const fs = require('fs');
const path = require('path');
const mkdir = require('mkdirp');
const rimraf = require('rimraf');
const write = require('write');
const { logger } = require('./setup');
const loremipsum = require('lorem-ipsum');
const log = logger('dim');

const defaults = {
  startDate: 'December 17, 2010',
  dest: 'src/content',
  count: 1600,
  units: 'words',
  pages: 100
};

function generate(options = {}) {
  log.separator({ length: 5, line: '=' }, 'setup');
  log.starting('setup');
  const opts = Object.assign({}, defaults, options);
  let contents = loremipsum(opts);
  let num = opts.pages / 2;
  const date = formatDate(opts.startDate);
  const dest = (...args) => path.join(__dirname, opts.dest, ...args);
  log.starting('deleted');
  rimraf.sync(dest());
  log.finished('deleted', 'markdown files from previous build');

  log.starting('generated');
  if (!fs.existsSync(dest())) {
    mkdir(dest());
  }

  contents = `<a href="{{site.paths.root}}/index.html">Home</a>
<br>
<h1>{{title}}</h1>\n<h2>Article</h2>
{{#each (filter site.tags.tags tags) as |tag|}}
<a href="{{path}}">{{items.length}}</a>
{{/each}}
`
+ contents + `
<h2>Pages</h2>
<a href="{{pagerFirst pager "path"}}">First</a>
<a href="{{pagerPrev pager "path"}}">Prev</a>
<a>{{pager.number}}</a>
<a href="{{pagerNext pager "path"}}">Next</a>
<a href="{{pagerLast pager "path"}}">Last</a>
<hr>
{{#each site.tags.paths as |tag path|}}
<a href="{{tag}}">{{path}}</a>
{{/each}}
`;

  for (let i = 0; i < num; i++) {
    const file1 = page(date(i), contents, i, 1);
    const file2 = page(date(i), contents, i, 2);
    write.sync(dest(file1.path), file1.contents);
    write.sync(dest(file2.path), file2.contents);
  }


  log.finished('generated', `${num} markdown posts`);
  log.finished('setup', 'completed');
  log.separator({ length: 5, line: '=' });
}

function page(date, contents, i, n) {
  const file = {
    data: {
      title: 'Blog post - ' + i,
      description: 'This is a description',
      tags: tags().filter((v, i, a) => a.indexOf(v) === i).sort(),
      date: date,
      slug: 'foo-bar-baz-' + n
    }
  };

  let str = stringify(file.data) + contents;
  file.path = `${date}-${file.data.slug}.md`;
  file.contents = Buffer.from(str);
  return file;
}

function stringify(data) {
  return '---\n' + JSON.stringify(data, null, 2) + '\n---\n\n';
}

function formatDate(startDate) {
  const start = new Date(startDate);
  const dayOne = start.getDate();
  return i => {
    const day = new Date(start);
    day.setDate(dayOne + i);
    return datestamp(day);
  };
}

function datestamp(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return `${year}-${month}-${day}`;
}

/**
 * add some tags to the posts
 */

function tags() {
  let arr = [];
  let n = Math.floor(Math.random() * 50);
  if (n >= 0 && n <= 20) arr.push('css');
  if (n >= 20 && n <= 35) arr.push('js', 'css');
  if (n >= 30 && n <= 50) arr.push('js');
  return arr;
}

module.exports = generate;
