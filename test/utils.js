'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const utils = require('../lib/utils');
const fixture = name => path.join(__dirname, 'fixtures', name);

describe('utils', () => {
  describe('.isBinary', () => {
    it('should be true when the given value is binary', () => {
      assert(utils.isBinary(fs.readFileSync(fixture('octdrey-catburn.jpg'))));
      assert(utils.isBinary(fs.readFileSync(fixture('octocat.png'))));
    });

    it('should be false when the given value is not binary', () => {
      assert(!utils.isBinary());
      assert(!utils.isBinary('foo'));
      assert(!utils.isBinary(Buffer.from('foo')));
      assert(!utils.isBinary(null));
    });
  });
});
