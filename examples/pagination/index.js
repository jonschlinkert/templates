const Collection = require('../lib/collection');
const File = require('../lib/file');
const posts = new Collection();
// posts.use(require('./pagination'));

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
posts.set('mmm.hbs');

// console.log(posts.groupBy('data.tags'));
// console.log(posts.groupBy('extname'));
// console.log(posts.groupBy('stem'));
// console.log(posts.groupBy(file => file.data.tags));

// const tags = posts.collect('data.tags', { singular: 'data.tag' }, page => {
//   page.path = '/blog/' + page.path;
//   return page;
// });

// console.log(tags);

// const pages1 = posts.paginate({ perPage: 2 }, page => posts.file(page));
// console.log(pages1);

// const pages2 = posts.paginate(page => posts.file(page));
// console.log(pages2);


// const res = posts.collect('tags', { perPage: 3 }, item => {
//   // this.push(posts.file(item));
//   return posts.file(item);
// });
// console.log(res);

// // const file = posts.file({ path: 'tags/index.html', data: { links }})
// // console.log(res.links);

