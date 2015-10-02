var gulp = require('gulp');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var jshint = require('gulp-jshint');
require('jshint-stylish');

var lint = ['index.js', 'lib/**/*.js'];

gulp.task('coverage', function () {
  return gulp.src(lint)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire());
});

gulp.task('mocha', function () {
  return gulp.src('test/*.js')
    .pipe(mocha({reporter: 'spec'}))
    .pipe(istanbul.writeReports({
      reporters: [ 'text' ],
      reportOpts: {dir: 'coverage', file: 'summary.txt'}
    }))
});

gulp.task('test', ['mocha', 'coverage'], function () {
  return gulp.src(lint)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('default', ['test']);
