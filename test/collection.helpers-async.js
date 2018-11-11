'use strict';

require('mocha');
const assert = require('assert');
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const Collection = require('../lib/collection');
const helpers = require('./support/helpers');
const wait = (fn, n) => new Promise(resolve => setTimeout(() => resolve(fn()), n || 10));
let pages;
let other;

describe('helpers - async', () => {
  beforeEach(function() {
    pages = new Collection('pages', { asyncHelpers: true });
    other = new Collection('other', { asyncHelpers: true });
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
    it('should set a sync helper', async () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      assert(pages.helpers.upper);
    });

    it('should set the original helper function on .helper', async () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      assert(pages.helpers.upper);
      assert.deepEqual(pages.helpers.upper.helper.toString(), upper.toString());
    });
  });

  describe('get', () => {
    it('should get a helper', async () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      assert.deepEqual(pages.helper('upper').helper.toString(), upper.toString());
    });

    it('should get a wrapped helper', async () => {
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

    it('should create a new app.ids Map for each instance', async () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);
      other.helper('upper', upper);

      await pages.render('a.hbs');
      await other.render('a.hbs');

      assert.equal(pages.ids.size, 1);
      assert.equal(other.ids.size, 1);
    });

    it('should add an id to the Map for each helper invocation', async () => {
      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);

      await pages.render('a.hbs');
      await pages.render('a.hbs');
      await pages.render('a.hbs');
      await pages.render('a.hbs');

      assert.equal(pages.ids.size, 4);
    });

    it('should support sync helpers by default', async () => {
      pages.options.asyncHelpers = false;

      const upper = str => str.toUpperCase();
      pages.helper('upper', upper);

      assert.equal(pages.helper('upper').helper.toString(), upper.toString());
      const page = pages.get('a.hbs');
      await pages.render(page);

      assert.equal(page.contents.toString(), 'a BRIAN b');
      assert.equal(pages.ids.size, 0);
    });

    it('should support async helpers that take arrays as arguments', async () => {
      pages.cache.data.upper = async str => await wait(() => str.toUpperCase(), 10);

      pages.helper('map', async (arr, fn) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = await fn(arr[i]);
        }
        return arr.join(',');
      });

      pages.set({ path: 'foo.hbs', contents: Buffer.from('{{#map names upper}}{{.}}{{/map}}') });
      const file = pages.get('foo.hbs');

      await pages.render(file, { names: ['doowb', 'jonschlinkert'] });
      assert.equal(file.contents.toString(), 'DOOWB,JONSCHLINKERT');
    });

    it('should support helpers used as arguments that return objects', async () => {
      const user = function(name) {
        return { name };
      };

      const profile = function(user) {
        return user.name;
      };

      pages.helper('profile', profile);
      pages.helper('user', user);

      const page = await pages.set({
        path: 'foo.hbs',
        contents: Buffer.from('Name: {{profile (user name)}}')
      });

      await pages.render(page, { name: 'doowb' });
      assert.equal(page.contents.toString(), 'Name: doowb');
    });
  });

  describe('errors', () => {
    it('should handle errors in async helpers', async() => {
      pages.helper('upper', str => {
        throw new Error('broken');
      });

      try {
        await pages.render('a.hbs');
      } catch (err) {
        assert.equal(err.message, 'broken');
      }
    });
  });
});
