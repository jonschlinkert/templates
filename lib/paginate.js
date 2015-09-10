'use strict';

var Pages = require('./pages');

module.exports = function paginate(arr, options) {
  options = options || {};
  var limit = options.limit || 10;
  if (limit < 0) limit = 10;
  var len = arr.length, i = 0;
  var total = Math.ceil(len / limit);
  var pages = new Pages(), page = Object.create({}), prev;
  while (i < total) {
    var start = i * limit;
    var end = start + limit;
    page.items = arr.slice(start, end);
    pages.push(page);
    i++;
    page = Object.create({});
  }
  return pages;
};
