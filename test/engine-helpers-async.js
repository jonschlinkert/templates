'use strict';

require('mocha');
const util = require('util');
const assert = require('assert');
const Engine = require('engine');
const Collection = require('../lib/collection');
const engines = require('./support/engines');
const helpers = require('./support/helpers');
const wait = (fn, n) => new Promise(resolve => setTimeout(() => resolve(fn()), n || 10));
let pages, render, other, tmpl, locals;

describe('engine helpers - async', () => {
  beforeEach(async function() {
    const base = engines.base(new Engine());
    pages = new Collection('pages', { asyncHelpers: true, type: 'renderable' });
    pages.engine('tmpl', base);

    pages.helper(helpers.common);
    pages.helper(helpers.commonAsync);

    await pages.set('a.tmpl', {
      contents: Buffer.from('a <%= upper(name) %> b'),
      data: { name: 'Brian' }
    });

    render = async(str, locals) => {
      const page = await pages.set('foo.tmpl', { contents: Buffer.from(str) });
      await pages.render(page, locals);
      return page.contents.toString();
    };

    locals = {
      person: {
        first: 'Brian',
        last: 'Woodward',
        toString: function() {
          return this.first + ' ' + this.last;
        }
      }
    };
  });

  it('should work with variables', async() => {
    assert.equal(await render('<%= name %>', { name: 'Brian' }), 'Brian');
  });

  it('should work with variables', async() => {
    assert.equal(await render('<%= name %>', { name: 'Brian' }), 'Brian');
  });

  it('should work with helpers', async() => {
    assert.equal(await render('<%= upper(name) %>', { name: 'Brian' }), 'BRIAN');
    assert.equal(await render('<%= sum(1, 2, 3) %>'), '6');
  });

  it('should work with helpers and locals', async() => {
    assert.equal(await render('<%= getUser(obj, "person") %>', locals), 'Brian Woodward');
  });

  it('should work with nested functions', async() => {
    assert.equal(await render('<%= upper(lower(upper(name))) %>', { name: 'Brian' }), 'BRIAN');
    assert.equal(await render('<%= spacer(upper(name), lower("X")) %>', { name: 'Brian' }), 'BxRxIxAxN');
  });
});
