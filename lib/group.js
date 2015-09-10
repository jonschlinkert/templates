'use strict';

var Base = require('base-methods');
var utils = require('./utils');

function Group(options) {
  Base.call(this, options);
  this.define('List', this.List || require('./list'));
}

Base.extend(Group);

Group.prototype.use = function(fn) {
  fn.call(this, this);
  return this;
};

Group.prototype.get = function() {
  var res = Base.prototype.get.apply(this, arguments);
  if (Array.isArray(res)) {
    var List = this.get('List');
    var list = new List();
    list.addItems(res);
    return list;
  }

  if (typeof res === 'object') {
    var List = this.get('List');
    var keys = Object.keys(List.prototype);
    keys.forEach(function(key) {
      if (typeof res[key] !== 'undefined') return;

      utils.define(res, key, function() {
        throw new Error(key + ' can only be used with an array of `List` items.');
      });
    });
  }
  return res;
};

module.exports = Group;
