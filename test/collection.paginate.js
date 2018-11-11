'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const engine = require('engine-handlebars');
let posts, other;

const template = `
{{#with pagination.pages}}
  <a href="{{lookup (first) "stem"}}">First</a>
  <a href="{{lookup (prev ../file) "stem"}}">Prev</a>
  <a href="{{lookup (next ../file) "stem"}}">Next</a>
  <a href="{{lookup (last) "stem"}}">Last</a>
{{/with}}`;

describe('collection.paginate', () => {
  beforeEach(() => {
    posts = new Collection('posts', { sync: true });
    other = new Collection('other', { sync: true });
    posts.engine('hbs', engine(require('handlebars')));
    other.engine('hbs', engine(require('handlebars')));
    posts.handler('onPaginate');
    posts.handler('onPager');
  });

  describe('pages', () => {
    it('should create a list of pagination pages', async() => {
      posts.set('aaa.hbs', { contents: Buffer.from('') });
      posts.set('bbb.hbs', { contents: Buffer.from('') });
      posts.set('ccc.hbs', { contents: Buffer.from('') });

      const pages = await posts.pager();
      assert(Array.isArray(pages));
      assert.equal(pages.length, 3);
    });

    it('should handle onPager middleware', () => {
      let count = 0;
      posts.onPager(/\.hbs$/, file => {
        file.path = `/site/posts/${file.stem}/index.html`;
        count++;
      });

      posts.option('engine', 'hbs');
      posts.set('aaa.hbs', { contents: Buffer.from('') });
      posts.set('bbb.hbs', { contents: Buffer.from('') });
      posts.set('ccc.hbs', { contents: Buffer.from('') });

      const pages = posts.pager();
      assert.equal(count, 3);
      assert.equal(pages[0].path, '/site/posts/aaa/index.html');
      assert.equal(pages[1].path, '/site/posts/bbb/index.html');
      assert.equal(pages[2].path, '/site/posts/ccc/index.html');
    });

    it('should render pagination pages', async () => {
      const buf = Buffer.from(template);

      posts.onPager(/\.hbs$/, file => {
        file.path = `/site/posts/${file.stem}.html`;
      });

      posts.option('engine', 'hbs');
      posts.set('aaa.hbs', { contents: buf });
      posts.set('bbb.hbs', { contents: buf });
      posts.set('ccc.hbs', { contents: buf });

      const pages = await posts.pager();

      const data = { pagination: { pages } };
      const actual = [];

      for (const post of posts.list) {
        await posts.render(post, data);
        actual.push(post.contents.toString());
      }

      assert.deepEqual(actual, [
        '\n  <a href="aaa">First</a>\n  <a href="">Prev</a>\n  <a href="bbb">Next</a>\n  <a href="ccc">Last</a>\n',
        '\n  <a href="aaa">First</a>\n  <a href="aaa">Prev</a>\n  <a href="ccc">Next</a>\n  <a href="ccc">Last</a>\n',
        '\n  <a href="aaa">First</a>\n  <a href="bbb">Prev</a>\n  <a href="">Next</a>\n  <a href="ccc">Last</a>\n'
      ]);
    });

    it('should add pagination.items to page.data', async() => {
      posts.option('engine', 'hbs');
      posts.set('aaa.hbs', { contents: Buffer.from('') });
      posts.set('bbb.hbs', { contents: Buffer.from('') });
      posts.set('ccc.hbs', { contents: Buffer.from('') });
      posts.set('ddd.hbs', { contents: Buffer.from('') });
      posts.set('eee.hbs', { contents: Buffer.from('') });
      posts.set('fff.hbs', { contents: Buffer.from('') });
      posts.set('ggg.hbs', { contents: Buffer.from('') });
      posts.set('hhh.hbs', { contents: Buffer.from('') });

      for (let page of await posts.paginate()) {
        assert(page.data.pagination);
        assert(Array.isArray(page.data.pagination.items));
        assert.equal(page.data.pagination.items.length, 8);
      }
    });

    it('should render pagination pages', () => {
      posts.set('aaa.hbs', { contents: Buffer.from(template) });
      posts.set('bbb.hbs', { contents: Buffer.from(template) });
      posts.set('ccc.hbs', { contents: Buffer.from(template) });

      const index = other.set('index.hbs', { contents: Buffer.from(template) });

      other.render(index, { pagination: { pages: posts.pager() }});
      assert(/aaa">First/.test(index.contents.toString()));
      assert(/ccc">Last/.test(index.contents.toString()));
    });
  });
});
