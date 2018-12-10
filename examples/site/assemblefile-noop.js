'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const symbol = Symbol.for('ASSEMBLE_SITE');
const matter = require('./build/utils/matter');
const rename = require('./build/utils/rename');
const plugins = require('./build/plugins');
const write = require('write');
const App = require('templates');
const app = new App({ sync: true, handlers: ['onLoad'] });
const destFn = path.join.bind(path, __dirname, 'blog');

app.on('error', console.log);
app.option('engine', 'noop');
app.data('site', { title: 'Home' });
app.use(plugins.write());
app.use(plugins.load());

// template collections
app.create('layouts', { type: 'layout' });
app.create('partials', { type: 'partial' });
app.create('pages', { type: 'renderable' });
app.pages.onLoad(/\.md/, file => {
  file[symbol] = {};
  matter(file);
  rename(destFn, file);
});

app.pages.load(path.join(__dirname, 'content'), file => {
  if (!/\.md$/.test(file.basename)) return false;
  return path.basename(file.dirname) === 'content';
});

app.pages.write(destFn);
