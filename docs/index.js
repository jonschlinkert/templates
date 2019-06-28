const fs = require('fs');
const path = require('path');
const str = fs.readFileSync(path.join(__dirname, 'variables.md'), 'utf8');

function parse(str) {
  let lines = str.split('\n');
  let context = {};
  let result = [];
  let vars = [];

  for (let line of lines) {
    line = line.trim();
    if (line[0] === '|' && line[line.length - 1] === '|') {
      let segs = line.split('|').filter(Boolean).map(v => v.trim());
      let key = segs[0].replace(/`/g, '');
      if (!/^[-A-Z]/.test(key)) {
        context[key] = segs[1];
        vars.push(key);
      }
    }
  }

  vars = vars.filter((v, i) => vars.indexOf(v) === i);
  vars.sort();
  let res = {};

  for (let key of vars) {
    res[key] = context[key];
  }

  return { context: res, vars };
}

let ast = parse(str);
console.log(ast);
// console.log(ast.nodes.filter(n => n.type !== 'text'));
