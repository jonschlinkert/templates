'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const engine = require('engine-handlebars');
let posts, other;

describe('collection.pager', () => {
  beforeEach(function() {
    posts = new Collection('posts');
    other = new Collection('other');

    posts.engine('hbs', engine(require('handlebars')));
    other.engine('hbs', engine(require('handlebars')));
    posts.option('engine', 'hbs');
  });

  describe('pages', () => {
    it('should create paging for files in a collection', async() => {
      await posts.set('aaa.hbs', { contents: Buffer.from('') });
      await posts.set('bbb.hbs', { contents: Buffer.from('') });
      await posts.set('ccc.hbs', { contents: Buffer.from('') });
      await posts.set('ddd.hbs', { contents: Buffer.from('') });
      await posts.set('eee.hbs', { contents: Buffer.from('') });
      await posts.set('fff.hbs', { contents: Buffer.from('') });

      const pages = await posts.pager();
      assert(Array.isArray(pages));
      assert.equal(pages.length, 6);
    });

    it('should render pagination pages', async() => {
      posts.handler('onPager');

      const buf = Buffer.from(`
{{#with pagination.pages}}
  <a href="{{lookup (first) "path"}}">First</a>
  <a href="{{lookup (prev ../file) "path"}}">Prev</a>
  <a href="{{lookup (next ../file) "path"}}">Next</a>
  <a href="{{lookup (last) "path"}}">Last</a>
{{/with}}`);

      posts.onPager(/\.(hbs|html)$/, file => {
        file.path = `/site/posts/${file.stem}/index.html`;
      });

      await posts.set('aaa.hbs', { contents: buf });
      await posts.set('bbb.hbs', { contents: buf });
      await posts.set('ccc.hbs', { contents: buf });
      await posts.set('ddd.hbs', { contents: buf });
      await posts.set('eee.hbs', { contents: buf });
      await posts.set('fff.hbs', { contents: buf });

      const pages = await posts.pager();
      const data = { pagination: { pages } };

      for (const page of pages) {
        await posts.render(page, data);
        assert(/html">(Last|First)/.test(page.contents.toString()));
      }
    });
  });
});
