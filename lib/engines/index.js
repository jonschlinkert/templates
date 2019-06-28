'use strict';

module.exports = {
  get base() {
    return require('./base');
  },
  get handlebars() {
    return require('./handlebars');
  },
  get literal() {
    return require('./literal');
  },
  get noop() {
    return require('./noop');
  }
};
