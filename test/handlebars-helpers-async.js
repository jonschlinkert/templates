'use strict';

require('mocha');
const util = require('util');
const assert = require('assert');
const engines = require('engine-handlebars');
const Collection = require('../lib/collection');
const handlebars = require('handlebars');
const helpers = require('./support/helpers');
const wait = (fn, n) => new Promise(resolve => setTimeout(() => resolve(fn()), n || 10));
let pages, render, other, hbs, locals;

describe('handlebars helpers - async', () => {
  beforeEach(function() {
    const engine = engines(handlebars.create());
    hbs = engine.instance;

    hbs.registerPartial('custom', 'a partial');
    hbs.registerPartial('baz', 'partial baz');

    pages = new Collection('pages', { asyncHelpers: true });
    pages.engine('hbs', engine);

    pages.helper(hbs.helpers);
    pages.helper(helpers.common);
    pages.helper(helpers.commonAsync);
    pages.helper(helpers.hbs);
    pages.helper(helpers.hbsAsync);

    render = async(str, locals) => {
      const page = await pages.set('foo.hbs', { contents: Buffer.from(str) });
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
    assert.equal(await render('{{name}}', { name: 'Brian' }), 'Brian');
  });

  it('should work with helpers', async() => {
    assert.equal(await render('{{upper name}}', { name: 'Brian' }), 'BRIAN');
    assert.equal(await render('{{sum 1 2 3}}'), '6');
  });

  it('should work with helpers and locals', async() => {
    assert.equal(await render('{{getUser this "person"}}', locals), 'Brian Woodward');
  });

  it('should work with sub-expressions', async() => {
    assert.equal(await render('{{upper (lower (upper name))}}', { name: 'Brian' }), 'BRIAN');
    assert.equal(await render('{{spacer (upper name) (lower "X")}}', { name: 'Brian' }), 'BxRxIxAxN');
  });

  it('should work with block expressions', async() => {
    assert.equal(await render('{{#block}}{{upper name}}{{/block}}', { name: 'Brian' }), 'BRIAN');
  });

  it('should work with built-in handlebars conditionals', async() => {
    assert.equal(await render('{{#if (equals "bar" foo)}}:) {{else}}:({{/if}}', { foo: 'baz' }), ':(');
  });

  it('should work with partial blocks', async() => {
    hbs.registerPartial('registered', 'a partial');
    assert.equal(await render('{{#> notRegistered }}Show me!{{/notRegistered}}'), 'Show me!');
    assert.equal(await render('{{#> registered }}Don\'t how me!{{/registered}}'), 'a partial');
  });

  it('should work with inline partials', async() => {
    hbs.registerPartial('registered', 'a partial');
    assert.equal(await render('{{#*inline "layout" }}My Content{{/inline}}{{> layout }}'), 'My Content');
    assert.equal(await render('A{{upper name}}B', { name: 'Brian Woodward'}), 'ABRIAN WOODWARDB');
    // assert.equal(await render('{{#*inline "layout2" }}A{{upper .}}B{{/inline}}{{> layout2 (getUser this "person") }}', locals), 'ABRIAN WOODWARDB');
  });

  it('should work with sub-expressions on block helpers', async() => {
    const fixture = '{{#useHash me=(getUser this "person")}}{{me}}{{/useHash}}';
    assert.equal(await render(fixture, locals), 'Brian Woodward');
  });

  it('should resolve a dynamic partial from a string name on options.hash', async() => {
    hbs.registerPartial('foo', 'a partial');
    assert.equal(await render('{{> (partialName name="foo") }}'), 'a partial');
  });

  it('should resolve a dynamic partial from a variable name on options.hash', async() => {
    hbs.registerPartial('foo', 'a partial');
    assert.equal(await render('{{> (partialName name=bar) }}', { bar: 'foo' }), 'a partial');
  });
});
