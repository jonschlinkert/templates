'use strict';

const symbol = Symbol.for('bench');
const path = require('path');

const dest = (file, options = {}) => {
  const pad = str => str.padStart(2, '0');
  const regex = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.*?)\.(md|html)/;
  const match = regex.exec(file.basename);
  if (!match) return file.relative;
  const [ year, month, day, slug ] = match.slice(1);
  return `${year}/${pad(month)}/${pad(day)}/${slug}.html`;
};

module.exports = (file, destBase) => {
  if (file[symbol].renamed === true) return;
  file[symbol].renamed = true;
  file.extname = path.extname(file.path);
  file.stem = path.basename(file.path, file.extname);
  file.basename = file.stem + '.html';
  file.path = destBase(dest(file));
  file.dirname = path.dirname(file.path);
};
