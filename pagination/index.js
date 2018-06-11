const Collection = require('../lib/collection');
const View = require('../lib/view');
const posts = new Collection({ sync: true });
posts.use(require('./pagination'));

posts.set('aaa.hbs', { data: { tags: ['a', 'b'] } });
posts.set('bbb.hbs', { data: { tags: ['c'] } });
posts.set('ccc.hbs', { data: { tags: ['a', 'd'] } });
posts.set('ddd.hbs', { data: { tags: ['e', 'f'] } });
posts.set('eee.hbs', { data: { tags: ['f'] } });
posts.set('fff.hbs', { data: { tags: ['f'] } });
posts.set('ggg.hbs', { data: { tags: ['c'] } });
posts.set('hhh.hbs', { data: { tags: ['e', 'a', 'b'] } });
posts.set('iii.hbs', { data: { tags: ['g', 'a', 'b'] } });
posts.set('jjj.hbs', { data: { tags: ['h', 'b', 'f'] } });
posts.set('lll.hbs', { data: { tags: ['i', 'b', 'c', 'd'] } });

const tags = posts.collect('tags');
console.log(tags);

const pages1 = posts.paginate({ perPage: 2 }, page => posts.view(page));
console.log(pages1);

// const pages2 = posts.paginate(page => posts.view(page));
// console.log(pages2);


// const res = posts.collect('tags', { perPage: 3 }, item => {
//   // this.push(posts.view(item));
//   return posts.view(item);
// });
// console.log(res);

// const view = posts.view({ path: 'tags/index.html', data: { links }})
// console.log(res.links);

