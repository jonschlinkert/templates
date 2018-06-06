'use strict';

require('mocha');
const util = require('util');
const assert = require('assert');
const engines = require('../lib/engines');
const Collection = require('../lib/collection');
const handlebars = require('./support/handlebars');
const helpers = require('./support/helpers');
const wait = (fn, n) => new Promise(resolve => setTimeout(() => resolve(fn()), n || 10));
let pages, render, other, hbs, locals;

describe('handlebars helpers - async', function() {
  beforeEach(function() {
    const engine = engines(require('handlebars'));
    hbs = engine.instance;

    hbs.registerPartial('custom', 'a partial');
    hbs.registerPartial('baz', 'partial baz');

    pages = new Collection('pages', { asyncHelpers: true });
    pages.engine('hbs', engine);

    pages.helper(hbs.helpers);
    pages.helper(helpers.common);
    pages.helper(helpers.hbs);

    render = (str, locals) => {
      const page = pages.set('foo.hbs', { contents: Buffer.from(str) });
      pages.render(page, locals);
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

  it('should work with variables', () => {
    assert.equal(render('{{name}}', { name: 'Brian' }), 'Brian');
  });

  it('should work with helpers', () => {
    assert.equal(render('{{upper name}}', { name: 'Brian' }), 'BRIAN');
    assert.equal(render('{{sum 1 2 3}}'), '6');
  });

  it('should work with helpers and locals', () => {
    assert.equal(render('{{getUser this "person"}}', locals), 'Brian Woodward');
  });

  it('should work with sub-expressions', () => {
    assert.equal(render('{{upper (lower (upper name))}}', { name: 'Brian' }), 'BRIAN');
    assert.equal(render('{{spacer (upper name) (lower "X")}}', { name: 'Brian' }), 'BxRxIxAxN');
  });

  it('should work with block expressions', () => {
    assert.equal(render('{{#block}}{{upper name}}{{/block}}', { name: 'Brian' }), 'BRIAN');
  });

  it('should work with built-in handlebars conditionals', () => {
    assert.equal(render('{{#if (equals "bar" foo)}}:) {{else}}:({{/if}}', { foo: 'baz' }), ':(');
  });

  it('should work with partial blocks', () => {
    hbs.registerPartial('registered', 'a partial');
    assert.equal(render('{{#> notRegistered }}Show me!{{/notRegistered}}'), 'Show me!');
    assert.equal(render('{{#> registered }}Don\'t how me!{{/registered}}'), 'a partial');
  });

  it('should work with inline partials', () => {
    hbs.registerPartial('registered', 'a partial');
    assert.equal(render('{{#*inline "layout" }}My Content{{/inline}}{{> layout }}'), 'My Content');
    assert.equal(render('A{{upper name}}B', { name: 'Brian Woodward'}), 'ABRIAN WOODWARDB');
    // assert.equal(render('{{#*inline "layout2" }}A{{upper .}}B{{/inline}}{{> layout2 (getUser this "person") }}', locals), 'ABRIAN WOODWARDB');
  });

  it('should work with sub-expressions on block helpers', () => {
    const fixture = '{{#useHash me=(getUser this "person")}}{{me}}{{/useHash}}';
    assert.equal(render(fixture, locals), 'Brian Woodward');
  });

  it('should resolve a dynamic partial from a string name on options.hash', () => {
    hbs.registerPartial('foo', 'a partial');
    assert.equal(render('{{> (partialName name="foo") }}'), 'a partial');
  });

  it('should resolve a dynamic partial from a variable name on options.hash', () => {
    hbs.registerPartial('foo', 'a partial');
    assert.equal(render('{{> (partialName name=bar) }}', { bar: 'foo' }), 'a partial');
  });
});
