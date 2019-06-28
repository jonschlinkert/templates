'use strict';

require('mocha');
const util = require('util');
const assert = require('assert').strict;
const handlebars = require('handlebars');
const engines = require('engine-handlebars');
const helpers = require('./support/helpers');
const App = require('..');
let app, render, other, hbs, locals;

describe('handlebars - partials', () => {
  beforeEach(function() {
    const engine = engines(handlebars.create());
    hbs = engine.instance;

    hbs.registerPartial('custom', 'a partial');
    hbs.registerPartial('baz', 'partial baz');
    hbs.registerHelper('partialName', function(options) {
      return options && options.hash.name ? options.hash.name : this.customName;
    });

    app = new App({ sync: true, handlers: ['onLoad'] });
    app.engine('hbs', engine);

    let pages = app.create('pages', { type: 'renderable' });
    let partials = app.create('partials', { type: 'partial' });

    partials.set('button.hbs', { contents: Buffer.from('<button>Click me!</button>') });

    render = (str, locals) => {
      const file = pages.set('fixture.hbs', { contents: Buffer.from(str) });
      app.render(file, locals);
      return file.contents.toString();
    };
  });

  it('should precompile partials', () => {
    assert.equal(render('Partial: {{> button }}'), 'Partial: <button>Click me!</button>');
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
