const pretty = require('pretty-time');
const colors = require('ansi-colors');
const handlebars = require('handlebars');
const engine = require('engine-handlebars');
const Templates = require('templates');
const app = new Templates({ sync: true, handlers: ['onLoad'] });
const hbs = engine(handlebars);
const cyan = (...args) => colors.cyan(pretty(...args.concat(2)));

app.engine('hbs', hbs);
app.create('pages');
app.create('layouts', { type: 'layout' });
app.create('partials', { type: 'partial' });
// app.onLoad(/\.hbs$/, hbs.compile.bind(hbs));

/**
 * Partials
 */

app.partials.set({ path: 'button', contents: Buffer.from('<button>{{text}}</button>') });
app.partials.set({ path: 'button2', contents: Buffer.from('<button>{{text}}</button>') });
app.partials.set({ path: 'button3', contents: Buffer.from('<button>{{text}}</button>') });

/**
 * Layouts
 */

app.layouts.set({ path: 'foo', contents: Buffer.from('before {% body %} after') });
app.layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'foo' });
app.layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after') });

const view = app.pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}, {{description}}'),
  data: { name: 'Brian' },
  layout: 'default'
});

const ns = n => n[0] * 1e9 + n[1];
const timer = () => {
  const start = process.hrtime();
  return () => {
    return process.hrtime(start);
  };
};

const increment = (num = 1000, step = 5) => {
  let n = Math.floor(num / 100 / step);
  let inc = n;

  return i => {
    if (i === inc) {
      process.stdout.write('\r' + Math.floor((inc / num) * 100) + '%');
      inc += n;
    }
    if (i === num) {
      process.stdout.write('\r');
    }
  };
};

console.time('total');
let n = 1e5;
let i = 0;

let time = timer();
let count = increment(n, 5);

while (i++ < n) {
  try {
    app.render(view, { description: 'This is page: ' + i });
    // console.log(view.contents.toString());
    view.reset();
    count(i);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

let total = time();
console.log('rendered:', colors.cyan(n.toLocaleString()), 'pages at', cyan(ns(total) / n), 'each');
console.timeEnd('total');
