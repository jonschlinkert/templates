'use strict';

const path = require('path');
const Engine = require('engine');
const engine = require('engine-base')(new Engine());
const App = require('..');
const app = new App();

/**
 * Listen for errors
 */

app.on('error', console.log);

/**
 * Engine
 */

app.engine('*', engine);
app.engine('html', engine);
app.option('engine', '*');

/**
 * Collections and rendering
 */

app.data({ title: 'Home' });

(async () => {

const pages = app.create('pages')
  .data('title', 'HOOMMMME!')

await pages.set('home', 'The <%= title %> page')
  .then(view => app.render(view))
  .then(view => console.log(view.contents.toString()));

const articles = app.create('articles');

await articles.set('one.html', 'The <%= title %> page')
  .then(view => app.render(view))
  .then(view => console.log(view.contents.toString()));


const posts = app.create('posts')
  .engine('*', engine)
  .data('title', 'HOOMMMME!');

posts.option('engine', '*');

await posts.set('home', 'The <%= title %> page');
await posts.set('about', 'The <%= title %> page');
await posts.set('other', 'The <%= title %> page');

const view = await posts.render(posts.get('home'));
console.log(view.contents.toString());

})();
