'use strict';

require('mocha');
require('should');
var path = require('path');
var assert = require('assert');
var isAbsolute = require('is-absolute');
var inherit = require('../lib/inherit');
var utils = require('../lib/utils')(require);

describe('utils', function () {
  describe('inherit', function() {
    it('should get the number of views:', function () {
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

  describe('resolveGlob', function() {
    it('should resolve absolute paths for a glob of files:', function () {
      var files = utils.resolveGlob('test/fixtures/**/*.js');
      assert(files.length > 0);
      files.forEach(function (fp) {
        assert(isAbsolute(fp));
      });
    });
  });

  describe('formatExt', function() {
    it('should ensure that file extension is preceded by a dot:', function () {
      assert(utils.formatExt('.js') === '.js');
      assert(utils.formatExt('js') === '.js');
    });

    it('should throw an error when not a string:', function () {
      (function () {
        utils.formatExt();
      }).should.throw('utils.formatExt() expects `ext` to be a string.');
    });
  });

  describe('stripDot', function() {
    it('should strip the dot preceding a file extension:', function () {
      assert(utils.stripDot('.js') === 'js');
      assert(utils.stripDot('js') === 'js');
    });

    it('should throw an error when not a string:', function () {
      (function () {
        utils.stripDot();
      }).should.throw('utils.stripDot() expects `ext` to be a string.');
    });
  });

  describe('requireGlob', function() {
    it('should return an object for a glob of files:', function () {
      var files = utils.requireGlob('test/fixtures/**/*.js');
      assert(files && typeof files === 'object');
      var keys = Object.keys(files);
      assert(keys.length > 0);
      keys.forEach(function (key) {
        var val = files[key];
        assert(typeof val === 'function' || typeof val === 'object');
      });
    });
  });
});

