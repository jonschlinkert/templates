'use strict';

require('mocha');
const assert = require('assert');
const Collection = require('../lib/collection');
const handlebars = require('./support/handlebars');
const engines = require('./support/engines');
const helpers = require('./support/helpers');
const wait = (fn, n) => new Promise(resolve => setTimeout(() => resolve(fn()), n || 10));
let pages;
let other;

describe('async-helpers', () => {
  beforeEach(function() {
    pages = new Collection('pages', { asyncHelpers: true });
    other = new Collection('other', { asyncHelpers: true });
    const engine = handlebars(require('handlebars'));
    pages.engine('hbs', engine);
    other.engine('hbs', engine);

    pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });
    other.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });
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
      const view = pages.get('foo.hbs');

      await pages.render(view, { names: ['doowb', 'jonschlinkert'] });
      assert.equal(view.contents.toString(), 'DOOWB,JONSCHLINKERT');
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

  // describe('errors', () => {
  //   it('should handle errors in sync helpers', () => {
  //     const upper = str => {
  //       throw new Error('broken');
  //     };

  //     pages.helper('upper', upper);
  //     try {
  //       pages.renderSync('a.hbs')
  //       throw new Error('expected an error');
  //     } catch (err) {
  //       console.log(err);
  //       assert.equal(err.message, 'broken');
  //     }
  //   });
  // });

  //   it('should handle errors in async helpers', async() => {
  //     const asyncHelpers3 = new AsyncHelpers();
  //     const upper = function(str, next) {
  //       throw new Error('UPPER Error');
  //     };
  //     upper.async = true;
  //     asyncHelpers3.set('upper', upper);
  //     const helper = asyncHelpers3.get('upper', {wrap: true});
  //     const id = helper('doowb');
  //     return await asyncHelpers3.resolveId(id)
  //       .then(function(val) {
  //         return Promise.reject(new Error('expected an error'));
  //       })
  //       .catch(function(err) {
  //         assert(err.hasOwnProperty('helper'), 'Expected a `helper` property on `err`');
  //       });
  //   });

  //   it('should handle returned errors in async helpers', async() => {
  //     const asyncHelpers3 = new AsyncHelpers();
  //     const upper = function(str, next) {
  //       next(new Error('UPPER Error'));
  //     };
  //     upper.async = true;
  //     asyncHelpers3.set('upper', upper);
  //     const helper = asyncHelpers3.get('upper', {wrap: true});
  //     const id = helper('doowb');
  //     return await asyncHelpers3.resolveId(id)
  //       .then(function(val) {
  //         throw new Error('expected an error');
  //       })
  //       .catch(function(err) {
  //         assert(err.hasOwnProperty('helper'), 'Expected a `helper` property on `err`');
  //       });
  //   });

  //   it('should handle errors with arguments with circular references', async() => {
  //     const asyncHelpers3 = new AsyncHelpers();
  //     const upper = function(str, next) {
  //       throw new Error('UPPER Error');
  //     };
  //     upper.async = true;
  //     asyncHelpers3.set('upper', upper);
  //     const helper = asyncHelpers3.get('upper', {wrap: true});
  //     const obj = {username: 'doowb'};
  //     obj.profile = obj;
  //     const id = helper(obj);
  //     return await asyncHelpers3.resolveId(id)
  //       .then(function(val) {
  //         throw new Error('Expected an error');
  //       })
  //       .catch(function(err) {
  //         assert(err.hasOwnProperty('helper'), 'Expected a `helper` property on `err`');
  //       });
  //   });
  // });

  // describe('wrapHelper', () => {
  //   it('should return the helper when given the helper name', async() => {
  //     const upper = str => str.toUpperCase();
  //     pages.helper('upper', upper);
  //     const fn = pages.wrapHelper('upper');
  //     assert.equal(fn, upper);
  //     assert.deepEqual(fn('doowb'), 'DOOWB');
  //   });

  //   it('should return the wrapped helper when given the helper name and wrap option is true', async() => {
  //     const upper = str => str.toUpperCase();
  //     pages.helper('upper', upper);
  //     const fn = pages.wrapHelper('upper', {wrap: true});
  //     assert.notEqual(fn, upper);
  //     assert.notEqual(fn.toString(), upper.toString());
  //     assert.deepEqual(fn('doowb'), '{$ASYNCID$0$0$}');
  //   });

  //   it('should return a function when given a function', async() => {
  //     const upper = str => str.toUpperCase();
  //     const fn = pages.wrapHelper(upper);
  //     assert.equal(fn, upper);
  //     assert.deepEqual(fn('doowb'), 'DOOWB');
  //   });

  //   it('should return a wrapped function when given a function and wrap option is true', async() => {
  //     const upper = str => str.toUpperCase();
  //     const fn = pages.wrapHelper(upper, {wrap: true});
  //     assert.notEqual(fn, upper);
  //     assert.deepEqual(fn('doowb'), '{$ASYNCID$0$0$}');
  //   });

  //   it('should return an object of helpers when given an object of helpers', async() => {
  //     const helpers = {
  //       upper: function(str) { return str.toUpperCase(); },
  //       lower: function(str) { return str.toLowerCase(); }
  //     };
  //     pages.helper(helpers);
  //     const obj = pages.wrapHelper();
  //     assert.deepEqual(obj, helpers);
  //     assert.equal(obj.upper('doowb'), 'DOOWB');
  //     assert.equal(obj.lower('DOOWB'), 'doowb');
  //   });

  //   it('should return an object of wrapped helpers when given an object of helpers and wrap option is true', async() => {
  //     const helpers = {
  //       upper: function(str) { return str.toUpperCase(); },
  //       lower: function(str) { return str.toLowerCase(); }
  //     };
  //     pages.helper(helpers);
  //     const obj = pages.wrapHelper({wrap: true});
  //     assert.notDeepEqual(obj, helpers);
  //     assert.equal(obj.upper('doowb'), '{$ASYNCID$0$0$}');
  //     assert.equal(obj.lower('DOOWB'), '{$ASYNCID$0$1$}');
  //   });

  //   it.skip('should return an object of helpers from a helper group', async() => {
  //     const helpers = function() {};
  //     helpers.isGroup = true;
  //     helpers.upper = function(str) { return str.toUpperCase(); };
  //     helpers.lower = function(str) { return str.toLowerCase(); };
  //     pages.helper('my-group', helpers);
  //     const res = pages.wrapHelper('my-group');
  //     assert.deepEqual(res, helpers);
  //     assert.equal(res.upper('doowb'), 'DOOWB');
  //     assert.equal(res.lower('DOOWB'), 'doowb');
  //   });
  // });
});
