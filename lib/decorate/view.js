'use strict';

var config = require('./config');
var utils = require('../utils');

/**
 * Default methods and settings that will be decorated onto
 * each view created by a collection.
 */

// decorate `option` method onto `view`
exports.option = function (app, view, options) {
  if (typeof view.option !== 'function') {
    config(view);
    utils.defaults(view.options, options);
  }
};

// decorate `compile` method onto `view`
exports.compile = function (app, view) {
  view.compile = function () {
    var args = [this].concat([].slice.call(arguments));
    app.compile.apply(app, args);
    return this;
  };
};

// decorate `render` method onto `view`
exports.render = function (app, view) {
  view.render = function () {
    var args = [this].concat([].slice.call(arguments));
    app.render.apply(app, args);
    return this;
  };
};

// decorate `context` method onto `view`
exports.context = function (app, view) {
  view.context = function (locals) {
    return utils.merge({}, this.locals, this.data, locals);
  };
};


exports.all = function (app, view, options) {
  exports.option(app, view, options);
  exports.compile(app, view);
  exports.render(app, view);
  exports.context(app, view);
};
