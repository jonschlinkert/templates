'use strict';

define(exports, 'config', () => require('./config'));
define(exports, 'helpers', () => require('./helpers'));
define(exports, 'logger', () => require('./logger'));
define(exports, 'parse', () => require('./parse'));
define(exports, 'rename', () => require('./rename'));

function define(obj, key, get) {
  Reflect.defineProperty(obj, key, { get });
}
