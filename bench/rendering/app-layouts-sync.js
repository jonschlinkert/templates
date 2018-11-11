const handlebars = require('handlebars');
const engine = require('templates/lib/engines');
const runner = require('setup/runner');
const Templates = require('templates');
const app = new Templates({ sync: true });
const hbs = engine(handlebars.create());

/**
 * Engine
 */

app.engine('hbs', hbs);
app.option('engine', 'hbs');


/**
 * Collections
 *
 */

app.create('pages');
app.create('layouts', { kind: 'layout' });
app.create('partials', { kind: 'partial' });

/**
 * Layouts
 */

app.layouts.set({ path: 'default', contents: Buffer.from('before {% body %} after'), layout: 'base' });
app.layouts.set({ path: 'base', contents: Buffer.from('before {% body %} after'), layout: 'inner' });
app.layouts.set({ path: 'inner', contents: Buffer.from('before {% body %} after') });

/**
 * View to be rendered
 */

const view = app.pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}. {{description}}'),
  data: { name: 'Brian', description: 'My blog.' },
  layout: 'default'
});

/**
 * Runner
 */

let run = runner.sync(app, view, app.layouts);

run(1);
run(10);
run(100);
run(1000);
run(10000);
run(100000);
// run(1000000);
