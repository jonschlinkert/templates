'use strict';

require('mocha');
const assert = require('assert');
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const Collection = require('../lib/collection');
const helpers = require('./support/helpers');
let pages, other;

describe('helpers - sync', () => {
  beforeEach(function() {
    pages = new Collection('pages', { sync: true });
    other = new Collection('other', { sync: true });
    const hbs = engine(handlebars.create());

    // engines
    pages.engine('hbs', hbs);
    other.engine('hbs', hbs);

    // files
    pages.set('a.hbs', {
      contents: Buffer.from('a {{upper name}} b'),
      data: { name: 'Brian' }
    });

    other.set('a.hbs', {
      contents: Buffer.from('a {{upper name}} b'),
      data: { name: 'Brian' }
    });
  });

  describe('set', () => {
    it('should set a sync helper', () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      assert(pages.helpers.upper);
    });

    it('should set the original helper function on .helper', () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      assert(pages.helpers.upper);
      assert.deepEqual(pages.helpers.upper.helper, upper);
    });

    it('should return the helper when given the helper name', () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      const fn = pages.helper('upper');
      assert.equal(fn.helper, upper);
      assert.deepEqual(fn('doowb'), 'DOOWB');
    });
  });

  describe('get', () => {
    it('should get a helper', () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      assert.deepEqual(pages.helper('upper').helper.toString(), upper.toString());
    });

    it('should get a wrapped helper', () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      assert.notEqual(pages.helper('upper').toString(), upper.toString());
    });
  });

  describe('resolve', () => {
    it('should return actual value', () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      assert.deepEqual(pages.helper('upper')('doowb'), 'DOOWB');
    });

    it('should support sync helpers by default', () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);

      assert.equal(pages.helper('upper').helper.toString(), upper.toString());
      const page = pages.get('a.hbs');
      pages.render(page);

      assert.equal(page.contents.toString(), 'a BRIAN b');
    });

    it('should support sync helpers that take arrays as arguments', () => {
      pages.cache.data.upper = str => str.toUpperCase();

      pages.helper('map', (arr, fn) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = fn(arr[i]);
        }
        return arr.join(',');
      });

      pages.set({ path: 'foo.hbs', contents: Buffer.from('{{#map names upper}}{{.}}{{/map}}') });
      const file = pages.get('foo.hbs');

      pages.render(file, { names: ['doowb', 'jonschlinkert'] });
      assert.equal(file.contents.toString(), 'DOOWB,JONSCHLINKERT');
    });

    it('should support helpers used as arguments that return objects', () => {
      const user = function(name) {
        return { name };
      };

      const profile = function(user) {
        return user.name;
      };

      pages.helper('profile', profile);
      pages.helper('user', user);

      const page = pages.set({
        path: 'foo.hbs',
        contents: Buffer.from('Name: {{profile (user name)}}')
      });

      pages.render(page, { name: 'doowb' });
      assert.equal(page.contents.toString(), 'Name: doowb');
    });
  });

  describe('errors', () => {
    it('should handle errors in sync helpers', () => {
      pages.helper('upper', str => {
        throw new Error('broken');
      });

      try {
        pages.render('a.hbs');
      } catch (err) {
        assert.equal(err.message, 'broken');
      }
    });
  });
});
