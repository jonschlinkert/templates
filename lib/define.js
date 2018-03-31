
module.exports = function define(app, key, val) {
  Reflect.defineProperty(app, key, {
    writable: true,
    configurable: true,
    enumerable: false,
    value: val
  });
};
