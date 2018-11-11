'use strict';

const fs = require('fs');
const path = require('path');
const File = require('../lib/file');
const symbol = Symbol.for('LAYOUT_HISTORY');

/**
 * Mock "pages" and "layouts" collections
 */

const pages = new Map();
const layouts = new Map();

pages.set('home', new File({contents: Buffer.from('This is the home page!'), layout: 'inner'}));

layouts.set('default', new File({ contents: Buffer.from('OUTER\n{% body %}\nOUTER') }));
layouts.set('inner', new File({contents: Buffer.from('INNER\n{% body %}\nINNER'), layout: 'A'}))
layouts.set('A', new File({contents: Buffer.from('AAA\n{% body %}\nAAA'), layout: 'B'}));
layouts.set('B', new File({contents: Buffer.from('BBB\n{% body %}\nBBB'), layout: 'C'}));
layouts.set('C', new File({contents: Buffer.from('CCC\n{% body %}\nCCC'), layout: 'default'}));

/**
 * Basic layout engine
 */

const render = (file, layouts) => {
  let layout = layouts.get(file.layout);
  let history = file[symbol] || (file[symbol] = []);
  let str;
  while (layout && !history.includes(layout)) {
    history.push(layout);
    str = layout.contents.toString().split('{% body %}').join(file.contents.toString());
    file.contents = Buffer.from(str);
    if (layout.layout) {
      layout = layouts.get(layout.layout);
    }
  }
  return file;
};

console.log(render(pages.get('home'), layouts).contents.toString());
