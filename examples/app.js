'use strict';

console.time('total');
const path = require('path');
const App = require('..');
const app = new App();

/**
 * Listen for errors
 */

app.on('error', console.log);

/**
 * Engine
 */

app.option('engine', 'literal');

/**
 * Collections and rendering
 */

app.data({ title: 'Home' });

(async () => {
  const pages = app.create('pages', { type: 'renderable' }).data('title', 'HOOMMMME!');
  await pages.set('home', 'The ${title} page')
    .then(view => app.render(view))
    .then(view => console.log(view.contents.toString()));

  const articles = app.create('articles', { type: 'renderable' });
  await articles.set('one.html', 'The ${title} page')
    .then(view => app.render(view))
    .then(view => console.log(view.contents.toString()));

  const posts = app.create('posts', { type: 'renderable' }).data('title', 'POSTS TITLE!');
  await posts.set('home', 'The ${title} page');
  await posts.set('about', 'The ${title} page');
  await posts.set('other', 'The ${title} page');

  const list = await Promise.all(posts.list.map(post => posts.render(post)));
  console.log(list[0].contents.toString());
  // const view = await posts.render(posts.get('home'));
  // console.log(view.contents.toString());
  console.timeEnd('total');
})();
