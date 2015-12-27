'use strict';

var util = require('util');
var utils = require('../utils');

module.exports = function(proto, name) {
  if (!name && proto.constructor) {
    name = proto.constructor.name;
  }

  /**
   * Format an error
   */

  proto.formatError = function(method, id, msg, view) {
    var ctx = this.errors[method][id];
    if (!view) view = {relative: ''};
    if (!msg) msg = '';

    var reason = name + '#' + method + ' ' + ctx;
    reason = util.format(reason, msg, view.relative);
    var res = utils.wrap(reason, {width: 70, indent: '', trim: true});

    var err = new Error(res);
    err.reason = res;
    err.id = id;
    err.msg = msg;
    return err;
  };

  /**
   * Rethrow an error in the given context to
   * get better error messages.
   */

  proto.rethrow = function(method, err, view, context) {
    if (this.options.rethrow !== true) return err;

    try {
      var opts = utils.extend({}, this.options.rethrow, {
        data: context,
        fp: view.path
      });

      utils.rethrow(view.content, opts);
    } catch (e) {
      err.method = method;
      err.reason = e;
      err.view = view;
      err.id = 'rethrow';
      err._called = true;
      return err;
    }
  };
};
