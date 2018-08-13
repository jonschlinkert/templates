const argv = require('minimist')(process.argv.slice(2));
const generate = require('./generate');
const render = argv.p ? require('./render-paginated') : require('./render');

generate({ pages: argv.n || 5000 });
render();
