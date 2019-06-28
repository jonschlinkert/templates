'use strict';

const fs = require('fs');

module.exports = file => {
  if (!file.contents) file.contents = fs.readFileSync(file.path);
  let str = file.contents.toString();
  let idx = str.indexOf('---', 4);
  if (str.slice(0, 3) === '---' && idx !== -1) {
    let matter = str.slice(3, idx);
    file.matter = Buffer.from(matter);
    file.data = JSON.parse(matter);
    file.contents = Buffer.from(str.slice(idx + 4).trim() + '\n');
  } else {
    file.data = {};
    file.contents = Buffer.from(str);
  }
  return file;
};
