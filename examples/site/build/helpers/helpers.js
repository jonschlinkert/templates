'use strict';

const get = require('get-value');

exports.array = function(arr, i) {
  if (/^[0-9]+$/.test(i)) {
    return arr[i];
  }
  if (i === 'first') {
    return arr[0];
  }
  if (i === 'last') {
    return arr[arr.length - 1];
  }
};

exports.pagerFirst = function(pager, prop) {
  let item = pager ? pager.items[0] : null;
  if (item) {
    return prop ? get(item, prop) : item;
  }
  return '';
};

exports.pagerLast = function(pager, prop) {
  let item = pager ? pager.items[pager.items.length - 1] : null;
  if (item) {
    return prop ? get(item, prop) : item;
  }
  return '';
};

exports.pagerPrev = function(pager, prop) {
  if (!pager) return '';
  let item = pager.items[pager.prev.index];
  if (item) {
    return prop ? get(item, prop) : item;
  }
};

exports.pagerCurrent = function(pager, prop) {
  if (!pager) return '';
  let item = pager.items[pager.index];
  if (item) {
    return prop ? get(item, prop) : item;
  }
};

exports.pagerNext = function(pager, prop) {
  if (!pager) return '';
  let item = pager.items[pager.next.index];
  if (item) {
    return prop ? get(item, prop) : item;
  }
};

exports.prevPath = function(pager) {
  let prev = pager.items[pager.prev.index];
  if (prev) {
    return prev.path;
  }
};

exports.nextPath = function(pager) {
  let next = pager.items[pager.next.index];
  if (next) {
    return next.path;
  }
};

exports.filter = function(obj = {}, arr = []) {
  const res = {};
  for (const key of Object.keys(obj)) {
    if (arr.includes(key)) {
      res[key] = obj[key];
    }
  }
  return res;
};
