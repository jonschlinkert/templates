const { Suite } = require('benchmark');
const argv = require('minimist')(process.argv.slice(2));
const cursor = require('ansi')(process.stdout);
const Collection = require('../lib/collection');

const cycle = (e, nl) => {
  cursor.eraseLine();
  cursor.horizontalAbsolute();
  cursor.write('  ' + e.target);
  if (nl) cursor.write('\n');
};

function bench(name) {
  if (!argv[name]) {
    const res = {};
    res.add = () => res;
    res.run = () => res;
    return res;
  }

  console.log(`\n# ${name}`);
  const suite = new Suite();
  const res = {
    run: suite.run.bind(suite),
    add: (key, fn) => {
      suite.add(key, {
        onCycle: e => cycle(e),
        onComplete: e => cycle(e, true),
        fn: fn
      });
      return res;
    }
  };
  return res;
}

/**
 * App
 */

bench('app')
  .add('no options', () => {
    new Collection('pages');
  })
  .add('options.sync', () => {
    new Collection('pages', { sync: true });
  })
  .add('options.handlers', () => {
    new Collection('pages', {
      handlers: ['onLoad', 'preRender', 'postRender', 'preWrite', 'postWrite']
    });
  })
  .add('options.helpers', () => {
    new Collection('pages', {
      helpers: {
        foo() {},
        bar() {},
      }
    });
  })
  .run();
