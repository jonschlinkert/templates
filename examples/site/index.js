'use strict';

const path = require('path');
const Engine = require('engine');
const engines = require('../../lib/engines');
const App = require('../..');
const app = new App();

/**
 * Listen for errors
 */

app.on('error', console.log);

/**
 * Engines
 */

const base = new Engine();
app.engine(['*', 'html'], engines.base(base));
app.option('hbs', engines(require('handlebars')));
app.option('engine', '*');

/**
 * Data
 */

app.data('site', { title: 'Home' });

/**
 * Collections and rendering
 */

app.create('pages');
app.create('layouts', { kind: 'layout' });
app.create('partials', { kind: 'partial' });
