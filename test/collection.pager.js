'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const engines = require('../lib/engines');
let posts, other;

describe('collection.pager', function() {
  beforeEach(function() {
    posts = new Collection('posts', { sync: true });
    other = new Collection('other', { sync: true });
    posts.engine('hbs', engines(require('handlebars')));
    other.engine('hbs', engines(require('handlebars')));
  });

  describe('pages', function() {
    it('should create paging for views in a collection', async() => {
      posts.set('aaa.hbs', { contents: Buffer.from('') });
      posts.set('bbb.hbs', { contents: Buffer.from('') });
      posts.set('ccc.hbs', { contents: Buffer.from('') });

      const pages = posts.pager();
      assert(Array.isArray(pages));
      assert.equal(pages.length, 3);
    });

    it('should render pagination pages', async() => {
    posts.handler('onPager');

      const buf = Buffer.from(`{{#with pagination.pages}}
  <a href="{{lookup (first) "path"}}">First</a>
  <a href="{{lookup (lookup this ../pager.prev) "path"}}">Prev</a>
  <span>{{lookup (lookup this ../pager.index) "path"}}</span>
  <a href="{{lookup (lookup this ../pager.next) "path"}}">Next</a>
  <a href="{{lookup (last) "path"}}">Last</a>
{{/with}}`);

      posts.onPager(/\.hbs$/, view => {
        view.path = `/site/posts/${view.stem}/index.html`;
      });

      posts.option('engine', 'hbs');
      posts.set('aaa.hbs', { contents: buf });
      posts.set('bbb.hbs', { contents: buf });
      posts.set('ccc.hbs', { contents: buf });

      const pages = posts.pager();

      const data = { pagination: { pages } };
      for (const page of pages) {
        posts.render(page, data);
        console.log(page.contents.toString());
      }
    });
  });
});
