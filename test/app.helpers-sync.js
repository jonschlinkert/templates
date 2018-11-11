'use strict';

require('mocha');
const assert = require('assert');
const Templates = require('..');
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
let app, render, other, hbs, locals;

describe('app helpers - sync', () => {
  beforeEach(() => {
    app = new Templates({ sync: true });
    app.engine('hbs', engine(handlebars.create()));

    const pages = app.create('pages');
    const partials = app.create('partials', { kind: 'partial' });

    partials.set('button.hbs', { contents: Buffer.from('<button>{{text}}</button>') });
    partials.set('button2.hbs', { contents: Buffer.from('<button>Click me!</button>') });

    app.helper('partial', function(val, locals = {}, options = {}) {
      if (locals.hash) {
        options = locals;
        locals = {};
      }

      const hbs = this.engine.instance;
      const file = partials.get(val);
      if (!file) return '';
      file.fn = hbs.compile(file.contents.toString());

      if (file.fn) return file.fn(Object.assign({}, locals, options.hash));

      app.render(file, locals);
      return file.contents.toString();
    });

    render = (str, locals) => {
      const file = pages.set('fixture.hbs', { contents: Buffer.from(str) });
      app.render(file, locals);
      return file.contents.toString();
    };
  });

  it('should precompile partials', () => {
    assert.equal(render('Partial: {{{partial "button" text="Click me!!!"}}}'), 'Partial: <button>Click me!!!</button>');
  });
});
