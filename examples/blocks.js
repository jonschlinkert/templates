var vfs = require('assemble-fs');
var loader = require('assemble-loader');
var streams = require('assemble-streams');
var render = require('assemble-render-file');
var runtimes = require('base-runtimes');
var matter = require('parser-front-matter');
var tasks = require('base-tasks');
var through = require('through2');
var Templates = require('..');
var app = new Templates();

app.use(tasks());
app.use(render());
app.use(runtimes());
app.use(streams());
app.use(loader());
app.use(vfs());

app.create('pages');
app.create('partials', {viewType: 'partial'});
app.create('layouts', {viewType: 'layout'});
app.engine(['hbs', 'md'], require('engine-handlebars'));
app.onLoad(/\.(hbs|md)$/, function(view, next) {
  matter.parse(view, next);
});

app.task('default', function() {
  app.layouts('fixtures/layouts/*.hbs', {cwd: __dirname});
  app.pages('fixtures/blocks.md', {cwd: __dirname});
  return app.toStream('pages')
    .pipe(app.renderFile('hbs'))
    .pipe(through.obj(function(file, enc, next) {
      console.log(file.contents.toString())
      next(null, file);
    }))

});

app.build(function(err) {
  if (err) return console.log(err);
});
