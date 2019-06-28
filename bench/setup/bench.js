'use strict';

const { Suite } = require('benchmark');
const argv = require('minimist')(process.argv.slice(2));

const cycle = (e, newline) => {
  process.stdout.write('\u001b[G');
  process.stdout.write(`  ${e.target}` + (newline ? '\n' : ''));
};

function bench(name, run) {
  if (!run && !argv[name]) {
    let res = {};
    res.add = () => res;
    res.run = () => res;
    return res;
  }

  console.log(`\n# ${name}`);
  let suite = new Suite();
  let res = {
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
    let fastest = suite.filter('fastest').map('name').toString();
    let times = [];

    suite.forEach(ele => times.push(+ele.hz));
    times.sort();

    let best = times.pop();
    let avgTime = times.reduce((acc, n) => acc + n, 0) / times.length;
    let avg = ((best - avgTime) / avgTime) * 100;
    console.log(`fastest is '${color.italic(fastest)}' (by ${avg.toFixed()} % avg)`);
    console.log();
  });
}

module.exports = bench;
