'use strict';

console.time('total');
process.on('exit', () => console.timeEnd('total'));

const path = require('path');
const symbol = Symbol.for('ASSEMBLE_SITE');
const matter = require('./build/utils/matter');
const collect = require('./build/utils/collect');
const rename = require('./build/utils/rename');
const render = require('./build/utils/render');
const plugins = require('./build/plugins');
const helpers = require('./build/helpers');
const hbs = require('engine-handlebars');
const App = require('templates');
const app = new App({ sync: true, handlers: ['onLoad'] });

const cwd = path.join.bind(path, __dirname, 'content');
const dest = path.join.bind(path, __dirname, 'blog');

app.on('error', console.log);
app.engine(['md', 'hbs', 'html'], hbs(require('handlebars')));

// add plugins
app.use(plugins.write({ render: false }));
app.use(plugins.load());

// add helpers
app.helper(helpers);

// template collections
app.create('layouts', { type: 'layout' });
app.create('partials', { type: 'partial' });
app.create('pages', { type: 'renderable' });

// global "site" data
app.data('site', { title: 'Home' });

// middleware
app.pages.onLoad(/\.md$/, file => {
  file.layout = 'default';
  file[symbol] = {};
  matter(file);
  file.cwd = dest();
  rename(dest, file);
  file.data.categories = categories(file);
  file.data.date = Date.UTC(...file.data.date.split('-'));
});

app.layouts.set('default', { contents: Buffer.from('A {% body %} B'), data: { foo: 'bar' } });

// load templates
app.pages.load(path.join(__dirname, 'content'), file => {
  if (!/\.md$/.test(file.basename)) return false;
  return path.basename(file.dirname) === 'content';
});

let { tags } = collect(app.pages, { cwd, dest, rename });

render.sync(app.pages, file => {
  let layouts = app.layouts;
  let page = { ...file, ...file.data };
  page.content = file.contents.toString();
  return { ...file.data, page, layouts, site: { paths: { root: dest() }, tags } };
});

// write files
app.write(dest, app.pages.list);

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value.split(/,\s*/);
  }
  return [];
}

function categories(file) {
  let arr = toArray(file.data.categories);
  let segs = path.dirname(file.relative)
    .split(/[\\/]/)
    .filter(Boolean)
    .filter(v => v !== '.' && !/^[0-9]+$/.test(v));
  segs.push(...arr);
  return [...new Set(segs)];
}
