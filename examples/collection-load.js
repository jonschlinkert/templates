const fs = require('fs');
const path = require('path');
const Collection = require('../lib/collection');
const collection = new Collection();

/**
 * Example plugin for synchronously loading files onto a collection
 */

collection.use(loader());

const filter = file => file.extname === '.txt';
const contents = file => fs.readFileSync(file.path);

collection.load(path.join(__dirname, 'fixtures'));
collection.load(path.join(__dirname, 'fixtures'), { read: true });
collection.load(path.join(__dirname, 'fixtures'), { recurse: true, read: true });
collection.load(path.join(__dirname, 'fixtures'), { recurse: true, extname: '.hbs' });
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
 * @return {object} Returns the file, if found.
 * @api public
 */

function loader() {
  return function(app) {
    Reflect.defineProperty(app, 'load', {
      value(cwd, options = {}) {
        const { extname, filter, contents, recurse, read } = options;

        const readdir = base => {
          for (let filename of fs.readdirSync(base)) {
            let fp = path.join(base, filename);
            if (this.files.has(fp)) continue;

            let stat = fs.statSync(fp);
            if (stat.isDirectory()) {
              if (recurse) readdir(fp);
              continue;
            }

            if (extname && path.extname(filename) !== extname) {
              continue;
            }


            let file = this.file({ path: fp, base, stat });
            if (filter && filter(file) === false) {
              continue;
            }

            if (read === true) {
              file.contents = fs.readFileSync(file.path);
            } else if (typeof contents === 'function') {
              file.contents = contents(file);
            }

            this.set(file);
          }
        }

        readdir(cwd);
        return this;
      }
    });
  }
}
