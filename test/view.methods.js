require('should');
var path = require('path');
var App = require('..');
var app;

describe('view.option()', function () {
  beforeEach(function () {
    app = new App();
    app.engine('tmpl', require('engine-base'));
    app.create('page');
  });


  describe('.use', function () {
    it('should expose `.use` for running plugins on a view:', function () {
      app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>'})
        .use(function () {
          this.options.foo = 'bar';
        })
        .use(function () {
          this.options.bar = 'baz';
        });

      var page = app.pages.getView('a.tmpl');
      page.options.should.have.property('foo');
      page.options.should.have.property('bar');
    });
  });

  describe('.render:', function () {
    it('should expose `.render` for rendering a view:', function (done) {
      app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', locals: {a: 'bbb'}})
        .render({}, function (err, res) {
          if (err) return done(err);
          res.contents.toString().should.equal('bbb');
          done();
        });
    });
  });

  describe('.dest:', function () {
    it('should expose `.dest` for calculating the view destination:', function (done) {
      app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', locals: {a: 'bbb'}})
        .dest('test/actual', function (err, res) {
          if (err) return done(err);
          res.should.equal(path.resolve('test/actual/a.tmpl'));
          done();
        });
    });

    it('should allow setting a dest path as a string', function (done) {
      var view = app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', locals: {a: 'bbb'}});
      view.dest = 'apple.html';
      view.dest('test/actual', function (err, res) {
        if (err) return done(err);
        res.should.equal(path.resolve('test/actual/apple.html'));
        done();
      });
    });

    it('should allow passing options', function (done) {
      var view = app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', locals: {a: 'bbb'}});
      view.dest = 'apple.html';
      view.dest('actual', {cwd: 'test'}, function (err, res) {
        if (err) return done(err);
        res.should.equal(path.resolve('test/actual/apple.html'));
        done();
      });
    });

    it('should allow passing a function to dest', function (done) {
      var view = app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', locals: {a: 'bbb'}});
      view.dest(function (file) {
        file.path = 'banana.html';
        return 'test/actual';
      }, function (err, res) {
        if (err) return done(err);
        res.should.equal(path.resolve('test/actual/banana.html'));
        done();
      });
    });

    it('should allow passing a function to dest and setting a dest path as a string', function (done) {
      var view = app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', locals: {a: 'bbb'}});
      view.dest = 'banana.html';
      view.dest(function (file) {
        return 'test/actual';
      }, function (err, res) {
        if (err) return done(err);
        res.should.equal(path.resolve('test/actual/banana.html'));
        done();
      });
    });

    it('should allow setting a function on dest to override the default functionality', function (done) {
      var view = app.page('a.tmpl', {path: 'a.tmpl', content: '<%= a %>', locals: {a: 'bbb'}});
      view.dest = function (dir, opts, cb) {
        if (typeof opts === 'function') {
          cb = opts;
          opts = {};
        }
        cb(null, path.resolve(path.join(dir, this.path)));
      };

      view.dest('test/actual', function (err, res) {
        if (err) return done(err);
        res.should.equal(path.resolve('test/actual/a.tmpl'));
        done();
      });
    });
  });
});
