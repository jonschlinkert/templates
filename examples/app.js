'use strict';
(async function() {

const lodash = require('lodash');
const engines = require('../test/support/engines');
const path = require('path');
const red = require('ansi-red');
const App = require('..');
const app = new App();

/**
 * Listen for errors
 */

app.on('error', console.log);

/**
 * Engine
 */

app.engine('*', engines.lodash(lodash));
app.engine('html', engines.lodash(lodash));
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
  .engine('*', engines.lodash(lodash))
  .data('title', 'HOOMMMME!');

await posts.set('home', 'The <%= title %> page');
await posts.set('about', 'The <%= title %> page');
await posts.set('other', 'The <%= title %> page');

posts.render(posts.get('home'))
  .then(view => console.log(view.contents.toString()));

})();
