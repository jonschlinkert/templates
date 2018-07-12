'use strict';
(async function() {

const Engine = require('engine');
const engines = require('../test/support/engines');
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

const base = new Engine();
app.engine('*', engines.base(base));
app.engine('html', engines.base(base));
app.option('engine', '*');

/**
 * Collections and rendering
 */

app.data({ title: 'Home' });

app.create('pages')
  .data('title', 'HOOMMMME!')
  .set('home', 'The <%= title %> page')
  .then(view => app.render(view))
  .then(view => console.log(view.contents.toString()));

app.create('articles')
  .set('one.html', 'The <%= title %> page')
  .then(view => app.render(view))
  .then(view => console.log(view.contents.toString()));


const posts = app.create('posts')
  .engine('*', engines.base(base))
  .data('title', 'HOOMMMME!');

await posts.set('home', 'The <%= title %> page');
await posts.set('about', 'The <%= title %> page');
await posts.set('other', 'The <%= title %> page');

posts.render(posts.get('home'))
  .then(view => console.log(view.contents.toString()));

})();
