const Collection = require('../lib/collection');

/**
 * TODO
 */

(async function() {

const pages = new Collection('pages', {
  handlers: ['onLoad'],
  schema: `

  `
});

await pages.set({ path: 'home', contents: Buffer.from('this is the home page') });

})();
