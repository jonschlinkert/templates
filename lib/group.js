'use strict';

var Base = require('base-methods');
var utils = require('./utils');
var List = require('./list');

function Group(options) {
  Base.call(this, options);
}

Base.extend(Group);

Group.prototype.use = function(fn) {
  fn.call(this, this);
  return this;
};

Group.prototype.get = function() {
  var res = Base.prototype.get.apply(this, arguments);
  if (Array.isArray(res)) {
    var list = new List();
    list.addItems(res);
    return list;
  }

  if (typeof res === 'object') {
    var keys = Object.keys(List.prototype);
    keys.forEach(function(key) {
      if (typeof res[key] !== 'undefined') return;

      res[key] = function() {
        throw new Error(key + ' can only be used with an array of `List` items.');
      };
    });
  }
  return res;
};

module.exports = Group;