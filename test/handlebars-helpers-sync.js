'use strict';

require('mocha');
const util = require('util');
const assert = require('assert');
const handlebars = require('handlebars');
const engines = require('engine-handlebars');
const Collection = require('../lib/collection');
const helpers = require('./support/helpers');
let pages, render, other, hbs, locals;

describe('handlebars helpers - sync', () => {
  beforeEach(function() {
    const engine = engines(handlebars.create());
    hbs = engine.instance;

    hbs.registerPartial('custom', 'a partial');
    hbs.registerPartial('baz', 'partial baz');

    pages = new Collection('pages', { sync: true });
    pages.engine('hbs', engine);

    pages.helper(helpers.common);
    pages.helper(helpers.hbs);
    pages.set('a.hbs', { contents: Buffer.from('a {{upper name}} b'), data: { name: 'Brian' } });

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

  describe('rendering', () => {
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
      assert.equal(render('{{prefix "+++" (lower (upper name))}}', { name: 'Brian' }), '+++brian');
      assert.equal(render('{{#each arr}}{{prefix "+++" (upper .)}}{{/each}}', { arr: ['foo', 'bar', 'baz'] }), '+++FOO+++BAR+++BAZ');
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
      assert.equal(render('{{#*inline "layout2" }}A{{upper .}}B{{/inline}}{{> layout2 (getUser this "person") }}', locals), 'ABRIAN WOODWARDB');
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

  describe('errors', () => {
    it('should handle errors in sync helpers', () => {
      pages.helper('upper', function(str) {
        throw new Error('broken');
      });

      try {
        pages.render('a.hbs');
        throw new Error('expected an error');
      } catch (err) {
        assert.equal(err.message, 'broken');
      }
    });
  });
});
