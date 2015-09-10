'use strict';


var Base = require('base-methods');
var utils = require('./utils');

function Page(page) {
  Base.call(this, page);
}

Base.extend(Page);

Page.prototype.isFirst = function() {
  return this.idx === 0;
};

Page.prototype.isLast = function() {
  return this.idx === (this.total - 1);
};

module.exports = Page;
