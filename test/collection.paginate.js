'use strict';

const assert = require('assert');
const Collection = require('../lib/collection');
const engines = require('../lib/engines');
let posts, other;

describe.skip('collection.pager', function() {
  beforeEach(function() {
    posts = new Collection('posts', { sync: true });
    other = new Collection('other', { sync: true });
    posts.engine('hbs', engines(require('handlebars')));
    other.engine('hbs', engines(require('handlebars')));
    posts.handler('onPager');
  });

  describe('pages', function() {
    it('should create a list of pagination pages', async() => {
      posts.set('aaa.hbs', { contents: Buffer.from('') });
      posts.set('bbb.hbs', { contents: Buffer.from('') });
      posts.set('ccc.hbs', { contents: Buffer.from('') });

      const pages = await posts.pager();
      assert(Array.isArray(pages));
      assert.equal(pages.length, 3);
    });

    it('should render pagination pages', async() => {
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

      const pages = await posts.pager();

      const data = { pagination: { pages } };
      for (const page of pages) {
        await posts.render(page, data);
        console.log(page.contents.toString());
      }

    });

    it('should render pagination pages2', async() => {
      posts.option('engine', 'hbs');
      posts.set('aaa.hbs', { contents: Buffer.from('') });
      posts.set('bbb.hbs', { contents: Buffer.from('') });
      posts.set('ccc.hbs', { contents: Buffer.from('') });
      posts.set('ddd.hbs', { contents: Buffer.from('') });
      posts.set('eee.hbs', { contents: Buffer.from('') });
      posts.set('fff.hbs', { contents: Buffer.from('') });
      posts.set('ggg.hbs', { contents: Buffer.from('') });
      posts.set('hhh.hbs', { contents: Buffer.from('') });

      for (const view of await posts.paginate()) {
        console.log(view.data);
      }
    });

//     it.skip('should render pagination pages', async() => {
//       const buf = Buffer.from(`{{#with pagination.pages}}
//   <a href="{{lookup (first) "path"}}">First</a>
//   <a href="{{lookup (lookup this ../pager.prev) "path"}}">Prev</a>
//   <span>{{lookup (lookup this ../pager.index) "path"}}</span>
//   <a href="{{lookup (lookup this ../pager.next) "path"}}">Next</a>
//   <a href="{{lookup (last) "path"}}">Last</a>
// {{/with}}`);

//       posts.set('aaa.hbs', { contents: buf });
//       posts.set('bbb.hbs', { contents: buf });
//       posts.set('ccc.hbs', { contents: buf });

//       const index = other.set('index.hbs', {
//         contents: Buffer.from(`{{#with pagination.pages}}
//   <a href="{{lookup (first) "path"}}">First</a>
//   <a href="{{lookup (lookup this ../pager.prev) "path"}}">Prev</a>
//   <span>{{lookup (lookup this ../pager.index) "path"}}</span>
//   <a href="{{lookup (lookup this ../pager.next) "path"}}">Next</a>
//   <a href="{{lookup (last) "path"}}">Last</a>
// {{/with}}`)
//       });

//       await other.render(index, { pagination: { pages: posts.pager() }});
//       console.log(index.contents.toString());
//     });
  });
});
