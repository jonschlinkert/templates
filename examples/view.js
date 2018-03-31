const path = require('path');
const View = require('../lib/view');
const cwd = path.resolve.bind(path, __dirname);
const view = new View({ path: cwd('fixtures/abc.txt'), cwd: cwd() });

view.path = cwd('foo/bar.txt');
// console.log(view.relative)
view.extname = '.hbs';
// view.stem = 'whatever';
// view.extname = '.hbs';
// view.stem = 'whatever';
// view.extname = '.hbs';
// view.basename = 'foo/bar.baz';

console.log(view.hasPath('abc.txt'))
console.log(view.hasPath('bar.hbs'))
// console.log(view)
// console.log(view.stat)

view.stats()
  .then(() => view.read())
  .then(() => view.write('foo'))
  .then(() => console.log(view.contents))
  .catch(console.error)

