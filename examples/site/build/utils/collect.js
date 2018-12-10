'use strict';

const tmpl = (item, title) => (`
<h1>Posts${title ? (' ' + title) : ''}</h1>
<ul>
  {{#each pagination.items}}
  <li><a href="{{path}}">{{data.slug}} > {{data.description}} ({{data.date}})</a></li>
  {{/each}}
</ul>

<a href="{{pagerFirst pager "path"}}">First</a>
<a href="{{pagerPrev pager "path"}}">Prev</a>
<a>{{pager.number}}</a>
<a href="{{pagerNext pager "path"}}">Next</a>
<a href="{{pagerLast pager "path"}}">Last</a>
`);

module.exports = (posts, options = {}) => {
  let { cwd, rename, dest, template = tmpl } = options;

  // create collection from front-matter tags
  let tags = posts.collect('tags', { singular: 'tag' });

  // paginate files
  posts.pager({
    sort(items) {
      return items.sort((a, b) => a.path.localeCompare(b.path));
    }
  });

  // create new paginated-pages, and add them to the posts collection
  posts.paginate(item => {
    let page = posts.set(item);
    page.engine = '.md';
    page.path = cwd(page.relative);
    page.base = cwd();
    page.cwd = cwd();
    page.contents = Buffer.from(template(item));
    rename(dest, page);
    return page;
  });

  tags.items.forEach(item => {
    item.key = item.path;
    posts.set(item);
    item.engine = '.md';
    item.contents = Buffer.from(template(item, 'with the tag: {{tag}}'));
    item.path = cwd(item.relative);
    item.base = cwd();
    item.cwd = cwd();
    rename(dest, item);
  });

  for (let key of Object.keys(tags.paths)) {
    tags.paths[key] = dest(tags.paths[key]);
  }

  return { posts, tags };
};
