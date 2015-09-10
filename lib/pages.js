'use strict';


var Base = require('base-methods');
var utils = require('./utils');
var Page = require('./page');

function Pages(page) {
  Base.call(this, page);
  this.pages = [];
}

Base.extend(Pages);

Pages.prototype.push = function(page) {
  page = new Page(page);
  // page.current = page;
  var prev = this.last;
  page.prev = prev && prev.idx;
  if (prev) {
    prev.next = this.pages.length;
  }

  var self = this;
  page.define('total', {
    enumerable: true,
    get: function () {
      return self.pages.length;
    },
    set: function () {}
  });

  page.idx = this.pages.length;
  this.pages.push(page);
};

utils.define(Pages.prototype, 'first', {
  get: function () {
    if (this.pages.length === 0) {
      return null;
    }
    return this.pages[0];
  }
});

utils.define(Pages.prototype, 'last', {
  get: function () {
    if (this.pages.length === 0) {
      return null;
    }
    return this.pages[this.pages.length - 1];
  }
});

module.exports = Pages;
