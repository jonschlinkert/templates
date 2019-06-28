// 'use strict';

// const symbol = Symbol('ASSEMBLE_SITE');
// const fs = require('fs');
// const path = require('path');
// const rimraf = require('rimraf');
// const mkdir = require('mkdirp');
// const write = require('write');
// const { Collection } = require('templates');
// const cwd = path.join.bind(path, __dirname, 'content');
// const destBase = path.join.bind(path, __dirname, 'blog');
// const dirs = new Set();

// const render = (srcDir, destDir) => {
//   let collection = new Collection('pages', { sync: true, type: 'renderable' });
//   collection.option('engine', 'noop');

//   // read posts
//   let files = fs.readdirSync(srcDir);

//   // parse front matter and add files
//   for (let filename of files) {
//     if (/\.md$/.test(filename)) {
//       let file = collection.set(parse({ path: cwd(filename), cwd: srcDir }));
//       file[symbol] = {};
//       renameFile(file);
//     }
//   }

//   // render files
//   for (let [, file] of collection.files) {
//     collection.render(file, { site: { paths: { root: destBase() } }});
//   }

//   // write files
//   for (let [, file] of collection.files) {
//     if (!dirs.has(file.dirname)) {
//       dirs.add(file.dirname);
//       mkdir.sync(file.dirname);
//     }
//     renameFile(file);
//     write.sync(file.path, file.contents);
//   }
// };

// function renameFile(file) {
//   if (file[symbol].renamed === true) return;
//   file[symbol].renamed = true;
//   file.extname = path.extname(file.path);
//   file.stem = path.basename(file.path, file.extname);
//   file.basename = file.stem + '.html';
//   file.path = destBase(dest(file));
//   file.dirname = path.dirname(file.path);
// }

// function dest(file, options = {}) {
//   if (options.groupBy !== 'date') return file.basename;
//   let pad = str => str.padStart(2, '0');
//   let regex = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.*?)\.(md|html)/;
//   let match = regex.exec(file.basename);
//   if (match) {
//     let [ year, month, day, slug ] = match.slice(1);
//     return `${year}/${pad(month)}/${pad(day)}/${slug}.html`;
//   }
//   return file.relative;
// }

// render.clean = (destDir = 'blog') => {
//   rimraf.sync(path.join(__dirname, destDir));
// };

// module.exports = render;
