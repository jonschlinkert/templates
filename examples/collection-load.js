const fs = require('fs');
const path = require('path');
const Collection = require('../lib/collection');
const collection = new Collection();

collection.use(loader());

const filter = file => file.extname === '.txt';
const contents = file => fs.readFileSync(file.path);

// collection.load(path.join(__dirname, 'fixtures'));
// collection.load(path.join(__dirname, 'fixtures'), { read: true });
// collection.load(path.join(__dirname, 'fixtures'), { recurse: true, read: true });
// collection.load(path.join(__dirname, 'fixtures'), { recurse: true, extname: '.hbs' });
collection.load(path.join(__dirname, 'fixtures'), { recurse: true, contents });
console.log(collection);

/**
 * Load a directory of views.
 *
 * ```js
 * collection.load('./foo/bar');
 * collection.load('./foo/bar', { recurse: true });
 * collection.load('./foo/bar', { recurse: true, extname: '.hbs' });
 * const filter = file => /\.hbs$/.test(file.path);
 * const contents = file => fs.readFileSync(file.path);
 * collection.load('./foo/bar', { recurse: true, filter });
 * collection.load('./foo/bar', { recurse: true, filter, contents });
 * ```
 * @name .load
 * @param {object} `dir`
 * @param {object} `options`
 * @return {object} Returns the view, if found.
 * @api public
 */

function loader() {
  return function(app) {
    Reflect.defineProperty(app, 'load', {
      value: function(cwd, options = {}) {
        const { extname, filter, contents, recurse, read } = options;

        const readdir = base => {
          const files = fs.readdirSync(base);
          for (const filename of files) {
            const fp = path.join(base, filename);
            const stat = fs.statSync(fp);

            if (stat.isDirectory()) {
              if (recurse) readdir(fp);
              continue;
            }

            if (extname && path.extname(filename) !== extname) {
              continue;
            }

            const view = this.view({ path: fp, base, stat });
            if (filter && filter(view) === false) {
              continue;
            }

            if (read === true) {
              view.contents = fs.readFileSync(view.path);
            } else if (typeof contents === 'function') {
              view.contents = contents(view);
            }

            this.set(view);
          }
        }

        readdir(cwd);
        return this;
      }
    });
  }
}
