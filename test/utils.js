/* deps: mocha */
var path = require('path');
var assert = require('assert');
var inherit = require('../lib/inherit');

describe('utils', function () {
  describe('inherit', function() {
    it('should get the number of items:', function () {
      var a = {};
      var b = {foo: 'bar'};
      inherit(a, b);
      assert(a.foo === 'bar');
    });

    it('should throw when receiver is not an object:', function () {
      (function() {
        inherit('foo', {});
      }).should.throw('expected receiver to be an object.');
    });

    it('should throw when provider is not an object:', function () {
      (function() {
        inherit({}, 'foo');
      }).should.throw('expected provider to be an object.');
    });
  });
});

