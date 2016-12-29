'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var loader = require('assemble-loader');
var parser = require('parser-front-matter');
var Templates = require('..');
var app;

var fixtures = path.join.bind(path, __dirname, 'fixtures');
function read(filepath) {
  return fs.readFileSync(filepath, 'utf8');
}
function expected(filepath) {
  return read(path.join(__dirname, 'expected', filepath));
}

describe('blocks', function() {
  before(function() {
    app = new Templates();
    app.use(loader());
    app.option({normalizeWhitespace: true});
    app.create('layouts', {viewType: 'layout'});
    app.create('pages');
    app.engine('html', function(view, options, cb) {
      cb(null, view);
    });
    app.onLoad(/front-matter/, function(file, next) {
      parser.parse(file, next);
    });
    app.layouts(fixtures('layouts/*.hbs'));
    app.layouts(fixtures('blocks/*.html'));
    app.pages(fixtures('*.html'));
  });

  function render(name, options, cb) {
    var page = app.pages.getView(name);

    if (options.layout) {
      page.layout = options.layout;
    } else if (options.extends) {
      page.extends = options.extends;
    } else {
      app.option(options);
    }

    app.render(page, function(err, view) {
      if (err) return cb(err);
      assert.equal(view.content, expected(name));
      cb();
    });
  }

  describe('{% layout %} tag', function() {
    it('should should inject text nodes', function(cb) {
      render('layout-text-node.html', {}, cb);
    });

    it('should inject content from a block into a layout block', function(cb) {
      render('layout-block.html', {}, cb);
    });

    it('should inject content from a block into a layout block outside of the body block', function(cb) {
      render('layout-block-outside-body.html', {}, cb);
    });

    it('should inject blocks and text nodes', function(cb) {
      render('layout-block-and-text-node.html', {}, cb);
    });

    it('should replace content', function(cb) {
      render('layout-tag-replace.html', {}, cb);
    });

    it('should work with nested content', function(cb) {
      render('layout-tag-nested.html', {}, cb);
    });

    it('should use a layout defined on the file object', function(cb) {
      render('layout-file-property.html', {layout: 'layout-default.html'}, cb);
    });
  });

  describe('extend block', function() {
    it('should extend a block defined on the file object', function(cb) {
      render('block-file-extends.html', {extends: 'basic'}, cb);
    });

    it('should extend a block defined in front-matter', function(cb) {
      render('block-file-front-matter.html', {}, cb);
    });

    it('should replace a block', function(cb) {
      render('block.html', {}, cb);
    });

    it('should indent a block', function(cb) {
      render('block-indent.html', {}, cb);
    });

    it('should replace a block', function(cb) {
      render('replace-block.html', {}, cb);
    });

    it('should prepend a block', function(cb) {
      render('prepend-block.html', {}, cb);
    });

    it('should append a block', function(cb) {
      render('append-block.html', {}, cb);
    });

    it('should not render (child) text nodes that are not inside blocks', function(cb) {
      render('text-nodes.html', {}, cb);
    });

    it('should repeat a block multiple times if defined in parent', function(cb) {
      render('repeat.html', {}, cb);
    });
  });

  describe('body tag', function() {
    it('should inject content where the body tag is positioned', function(cb) {
      render('body-tag.html', {}, cb);
    });
  });

  describe('missing blocks', function() {
    it('should not render blocks that are not defined in the parent template', function(cb) {
      render('blocks-missing.html', {}, cb);
    });
  });

  describe('other blocks', function() {
    it('should not match block names that aren\'t explicitly registered', function(cb) {
      render('other-blocks.html', {}, cb);
    });
  });

  describe('multiple blocks', function() {
    it('should replace the body block', function(cb) {
      render('block-body.html', {}, cb);
    });
    it('should replace multiple blocks', function(cb) {
      render('block-multiple.html', {}, cb);
    });
    it('should replace multiple blocks using `replace` hash argument', function(cb) {
      render('replace-block-multiple.html', {}, cb);
    });
    it('should prepend multiple blocks using `prepend` hash argument', function(cb) {
      render('prepend-block-multiple.html', {}, cb);
    });
    it('should append multiple blocks using `append` hash argument', function(cb) {
      render('append-block-multiple.html', {}, cb);
    });
    it('should replace, append or prepend multiple blocks', function(cb) {
      render('mixed-multiple.html', {}, cb);
    });
  });

  describe('nested extends', function() {
    it('should handled nested extends', function(cb) {
      render('nested-extends.html', {}, cb);
    });

    it('should append nested extends', function(cb) {
      render('nested-extends-append.html', {}, cb);
    });

    it('should stack appended nested extends', function(cb) {
      render('nested-extends-append-stacked.html', {}, cb);
    });

    it('should prepend nested extends', function(cb) {
      render('nested-extends-prepend.html', {}, cb);
    });

    it('should replace, append or prepend multiple nested blocks', function(cb) {
      render('nested-extends-mixed.html', {}, cb);
    });

    it('should replace, append or prepend multiple nested blocks2', function(cb) {
      render('nested-extends-mixed2.html', {}, cb);
    });
  });

  describe('nested blocks:', function() {
    it('nested blocks', function(cb) {
      render('nested-blocks-1.html', {}, cb);
    });

    it('prepend', function(cb) {
      render('nested-blocks-prepend.html', {}, cb);
    });

    it('append', function(cb) {
      render('nested-blocks-append.html', {}, cb);
    });

    it('append-repeat', function(cb) {
      render('nested-blocks-append-repeat.html', {}, cb);
    });

    it('accessors', function(cb) {
      render('accessors.html', {}, cb);
    });
  });

  describe('merge blocks', function() {
    it('should merge blocks', function(cb) {
      render('merge-blocks.html', {}, cb);
    });
  });

  describe('options', function() {
    it('should trim leading and trailing whitepace in blocks', function(cb) {
      render('options-trim.html', {trim: true}, cb);
    });
  });
});
