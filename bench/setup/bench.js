'use strict';

const { Suite } = require('benchmark');
const argv = require('minimist')(process.argv.slice(2));

const cycle = (e, newline) => {
  process.stdout.write('\u001b[G');
  process.stdout.write(`  ${e.target}` + (newline ? '\n' : ''));
};

function bench(name, run) {
  if (!run && !argv[name]) {
    const res = {};
    res.add = () => res;
    res.run = () => res;
    return res;
  }

  console.log(`\n# ${name}`);
  const suite = new Suite();
  const res = {
    run: suite.run.bind(suite),
    add(key, fn) {
      suite.add(key, {
        onCycle: e => cycle(e),
        onComplete: e => cycle(e, true),
        fn
      });
      return res;
    }
  };
  suite.on('complete', () => fastest(suite));
  return res;
}

function fastest(suite) {
  suite.on('complete', () => {
    const fastest = suite.filter('fastest').map('name').toString();
    const times = [];

    suite.forEach(ele => times.push(+ele.hz));
    times.sort();

    const best = times.pop();
    const avgTime = times.reduce((acc, n) => acc + n, 0) / times.length;
    const avg = ((best - avgTime) / avgTime) * 100;
    console.log(`fastest is '${color.italic(fastest)}' (by ${avg.toFixed()} % avg)`);
    console.log();
  });
}

module.exports = bench;
