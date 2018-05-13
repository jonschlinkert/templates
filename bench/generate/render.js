const fs = require('fs');
const path = require('path');
const util = require('util');
const rimraf = require('rimraf');
const mkdir = require('./mkdir');
const Collection = require('../../lib/collection');
const write = util.promisify(fs.writeFile);
const cwd = path.join.bind(path, __dirname, 'blog');
const dirs = new Set();

async function render(destDir) {
  console.time('  deleted existing files');
  rimraf.sync(path.join(__dirname, destDir || 'dist'));
  console.timeEnd('  deleted existing files');
  console.log();
  console.time('  generated 5,000 blog posts in');
  console.time('  read files');
  const files = fs.readdirSync(cwd());
  console.timeEnd('  read files');

  // collection
  console.time('  assemble');
  console.time('  create collection');
  const collection = new Collection('pages', { sync: true });
  collection.option('engine', 'noop');
  const views = new Set();
  console.timeEnd('  create collection');

  // parse
  console.time('  parse front-matter');
  for (const filename of files) {
    if (/\.md$/.test(filename)) {
      views.add(parse({ path: cwd(filename), cwd: cwd() }));
    }
  }
  console.timeEnd('  parse front-matter');

  // add views
  console.time('  add views');
  for (const view of views) collection.set(view);
  console.timeEnd('  add views');

  // render views
  console.time('  render content');
  for (const [key, view] of collection.views) {
    collection.render(view);
  }
  console.timeEnd('  render content');
  console.timeEnd('  assemble');

  // write files
  console.time('  write files');
  for (const [key, view] of collection.views) {
    if (!dirs.has(view.dirname)) {
      dirs.add(view.dirname);
      await mkdir(view.dirname);
    }
    await write(view.path, view.contents);
  }
  console.timeEnd('  write files');
  console.timeEnd('  generated 5,000 blog posts in');
}

function parse(file) {
  const str = fs.readFileSync(file.path, 'utf8');
  const idx = str.indexOf('---', 4);
  if (str.slice(0, 3) === '---' && idx !== -1) {
    const matter = str.slice(3, idx);
    file.matter = Buffer.from(matter);
    file.data = JSON.parse(matter);
    file.contents = Buffer.from(str.slice(idx + 4));
  }
  file.extname = path.extname(file.path);
  file.stem = path.basename(file.path, file.extname);
  file.basename = file.stem + '.html';
  file.path = path.join(__dirname, 'dist', file.basename);
  file.dirname = path.dirname(file.path);
  return file;
}

function dest(file) {
  const regex = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.*?)\.md/;
  const match = regex.exec(file.basename) || [];
  const [ year, month, day, slug ] = match.slice(1);
  return `${year}/${month}/${day}/${slug}.html`;
}

render();
