'use strict';

const path = require('path');
const dest = require('./dest');

module.exports = (destFn, file, options = {}) => {
  file.extname = path.extname(file.path);
  file.stem = path.basename(file.path, file.extname);
  file.basename = file.stem + '.html';
  file.path = destFn(dest(file, { groupBy: 'date', ...options }));
  file.dirname = path.dirname(file.path);
};
