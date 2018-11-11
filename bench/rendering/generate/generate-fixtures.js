'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const mkdir = require('mkdirp');
const rimraf = require('rimraf');
const write = util.promisify(fs.writeFile);
const loremipsum = require('lorem-ipsum');
const defaults = {
  startDate: 'December 17, 2010',
  dest: 'content',
  count: 1600,
  units: 'words',
  pages: 1000
};

async function generate(options = {}) {
  let opts = Object.assign({}, defaults, options);
  let contents = loremipsum(opts);
  let date = formatDate(opts.startDate);
  let dest = (...args) => path.join(__dirname, opts.dest, ...args);
  let time = `${opts.pages} pages`;
  console.time(time);

  rimraf.sync(dest());

  if (!fs.existsSync(dest())) {
    await mkdir(dest());
  }

  contents = `<a href="{{site.paths.root}}/index.html">Home</a>
<br>
<h1>{{title}}</h1>\n<h2>Article</h2>
{{#each (filter site.tags.tags tags) as |tag|}}
<a href="{{path}}">{{items.length}}</a>
{{/each}}
${contents}
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

  for (let i = 0; i < opts.pages; i++) {
    const file1 = page(date(i), contents, i, 1);
    const file2 = page(date(i), contents, i, 2);
    await write(dest(file1.path), file1.contents);
    await write(dest(file2.path), file2.contents);
  }

  console.timeEnd(time);
}

function page(date, contents, i, n) {
  const file = {
    data: {
      title: 'Blog post - ' + i,
      description: 'This is a description',
      tags: tags(),
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

// super-simple mock randomness
function tags() {
  const arr = [];
  switch (Math.floor(Math.random() * 50)) {
    case 3:
    case 9:
    case 10:
    case 12:
    case 22:
    case 38:
      arr.push('css');
      break;
    case 7:
    case 19:
    case 42:
    case 47:
    case 50:
      arr.push('js');
      break;
    case 25:
    case 41:
      arr.push('css', 'js');
      break;
  }
  return arr;
}

generate();
