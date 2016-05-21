'use strict';

var plugin = require('./');

module.exports = function(Base, Ctor, CtorName) {

  /**
   * Inherit `Base`
   */

  Base.extend(Ctor);
  Base.bubble(Ctor, ['preInit', 'Init']);

  /**
   * Decorate static methods
   */

  plugin.is(Ctor);

  /**
   * Mixin prototype methods
   */

  plugin.routes(Ctor.prototype);
  plugin.engine(Ctor.prototype);
  plugin.layout(Ctor.prototype);
  plugin.render(Ctor.prototype);
  plugin.errors(Ctor.prototype, CtorName);
};
