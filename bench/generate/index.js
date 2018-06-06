'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const mkdir = require('mkdirp');
const write = util.promisify(fs.writeFile);
const loremipsum = require('lorem-ipsum');
const defaults = {
  startDate: 'December 17, 2010',
  dest: 'blog',
  count: 1600,
  units: 'words',
  pages: 2500
};

function generate(options = {}) {
  const opts = Object.assign({}, defaults, options);
  const contents = loremipsum(opts);
  const date = formatDate(opts.startDate);
  const dest = (...args) => path.join(__dirname, opts.dest, ...args);
  const time = `${opts.pages} pages`;
  console.time(time);

  if (!fs.existsSync(dest())) {
    mkdir(dest());
  }

  for (let i = 0; i < opts.pages; i++) {
    const file1 = page(date(i), contents, i, 1);
    const file2 = page(date(i), contents, i, 2);
    write(dest(file1.path), file1.contents);
    write(dest(file2.path), file2.contents);
  }

  console.timeEnd(time);
}

function page(date, contents, i, n) {
  const file = {
    data: {
      title: 'Blog post - ' + i,
      description: 'This is a description',
      categories: [],
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

generate();
