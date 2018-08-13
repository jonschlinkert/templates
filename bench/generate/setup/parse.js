'use strict';

const symbol = Symbol.for('bench');
const fs = require('fs');

module.exports = file => {
  file[symbol] = file[symbol] || {};
  file.contents = fs.readFileSync(file.path);
  const str = file.contents.toString();
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
};
