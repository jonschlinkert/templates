'use strict';

module.exports = function(app) {
  app.use(require('verb-generate-readme'));

  app.helper('changelog', require('helper-changelog'));
  app.create('pages');
  app.pages('docs/api/*.md');

  app.task('docs', function() {
    return app.toStream('pages')
      .pipe(app.renderFile('*'))
      .pipe(app.pipeline(app.options.pipeline))
      .pipe(app.dest('docs/dist'));
  });

  app.task('default', ['readme', 'docs']);
};
