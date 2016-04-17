'use strict';

module.exports = function(app) {
  app.extendWith('verb-readme-generator');

  app.create('pages');
  app.pages('docs/api/*.md');

  app.task('docs', function() {
    return app.toStream('pages')
      .pipe(app.renderFile('*'))
      .pipe(app.dest('docs/dist'));
  });

  // app.task('docs', function() {
  //   return app.src('docs/api/*.md', { layout: null })
  //     .pipe(app.renderFile('*'))
  //     .pipe(app.dest('docs/dist'));
  // });

  app.task('default', ['readme', 'docs']);
};
