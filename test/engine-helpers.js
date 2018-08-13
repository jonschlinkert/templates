'use strict';

require('mocha');
const assert = require('assert');
const Engine = require('engine');
const Collection = require('../lib/collection');
const engines = require('./support/engines');
const helpers = require('./support/helpers');
let pages, render, locals;

describe('engine helpers - ', () => {
  beforeEach(() => {
    const base = engines.base(new Engine());
    pages = new Collection('pages', { asyncHelpers: true });
    pages.engine('tmpl', base);

    pages.helper(helpers.common);
    pages.helper(helpers.commonAsync);

    pages.set('a.tmpl', {
      contents: Buffer.from('a <%= upper(name) %> b'),
      data: { name: 'Brian' }
    });

    render = (str, locals) => {
      const page = pages.set('foo.tmpl', { contents: Buffer.from(str) });
      pages.render(page, locals);
      return page.contents.toString();
    };

    locals = {
      person: {
        first: 'Brian',
        last: 'Woodward',
        toString() {
          return this.first + ' ' + this.last;
        }
      }
    };
  });

  it('should work with variables', () => {
    assert.equal(render('<%= name %>', { name: 'Brian' }), 'Brian');
  });

  it('should work with variables', () => {
    assert.equal(render('<%= name %>', { name: 'Brian' }), 'Brian');
  });

  it('should work with helpers', () => {
    assert.equal(render('<%= upper(name) %>', { name: 'Brian' }), 'BRIAN');
    assert.equal(render('<%= sum(1, 2, 3) %>'), '6');
  });

  it('should work with helpers and locals', () => {
    assert.equal(render('<%= getUser(obj, "person") %>', locals), 'Brian Woodward');
  });

  it('should work with nested functions', () => {
    assert.equal(render('<%= upper(lower(upper(name))) %>', { name: 'Brian' }), 'BRIAN');
    assert.equal(render('<%= spacer(upper(name), lower("X")) %>', { name: 'Brian' }), 'BxRxIxAxN');
  });
});
