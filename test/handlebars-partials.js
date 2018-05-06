'use strict';

require('mocha');
const util = require('util');
const assert = require('assert');
const Templates = require('..');
const handlebars = require('../lib/engine');
const helpers = require('./support/helpers');
let app, render, other, hbs, locals;

describe('handlebars - partials', function() {
  beforeEach(function() {
    const engine = handlebars(require('handlebars'));
    hbs = engine.instance;

    hbs.registerPartial('custom', 'a partial');
    hbs.registerPartial('baz', 'partial baz');
    hbs.registerHelper('partialName', function(options) {
      return options && options.hash.name ? options.hash.name : this.customName;
    });

    app = new Templates({ sync: true, handlers: ['onLoad'] });
    app.engine('hbs', engine);

    app.onLoad(/./, view => {
      if (view.kind === 'partial') {
        hbs.registerPartial(view.stem, view.fn);
      }
      // console.log(view)
      // const template = '<div>whatever {{ name }}</div>';
      // const compiled = hbs.precompile(template);
      // console.log(compiled)

    });

    app.create('pages');
    app.create('partials', { kind: 'partial' });

    app.partials.set('button.hbs', { contents: Buffer.from('<button>Click me!</button>') });
    render = (str, locals) => {
      const view = app.pages.set('fixture.hbs', { contents: Buffer.from(str) });
      app.renderSync(view, locals);
      return view.contents.toString();
    };
  });

  it.skip('should precompile partials', () => {
    console.log(render('Partial: {{> button }}'))
    console.log(render('Partial: {{> button }}'))
    console.log(render('Partial: {{> button }}'))
    console.log(render('Partial: {{> button }}'))
    // assert.equal(render('Partial: {{> button }}'), 'Partial: <button>Click me!</button>');
  });

  it.skip('should resolve a dynamic partial from a string name on options.hash', () => {
    hbs.registerPartial('foo', 'a partial');
    assert.equal(render('{{> (partialName name="foo") }}'), 'a partial');
  });

  it.skip('should resolve a dynamic partial from a variable name on options.hash', () => {
    hbs.registerPartial('foo', 'a partial');
    assert.equal(render('{{> (partialName name=bar) }}', { bar: 'foo' }), 'a partial');
  });
});
