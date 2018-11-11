const fs = require('fs');
const symbol = Symbol.for('LAYOUT_HISTORY');
const File = require('vinyl');
const layouts = new Map();
const pages = new Map();

pages.set('home', new File({
  contents: Buffer.from('This is the home page!'),
  layout: 'default'
}));

layouts.set('default', new File({
  contents: fs.readFileSync('index.hbs'),
  // layout: 'inner'
}));

// layouts.set('inner', new File({
//   contents: Buffer.from('B {% body %} B'),
//   layout: 'base'
// }));

// layouts.set('base', new File({
//   contents: Buffer.from('C {% body %} C'),
//   layout: 'd'
// }));

// layouts.set('d', new File({
//   contents: Buffer.from('D {% body %} D')
// }));

const render = (view, layouts) => {
  let name = view.layout;
  let layout = layouts.get(name);
  let history = view[symbol] || (view[symbol] = []);
  let str;

  while (layout && !history.includes(layout)) {
    history.push(layout);
    str = layout.contents
      .toString()
      .split('{% body %}')
      .join(view.contents.toString());
    view.contents = Buffer.from(str);

    if (layout.layout) {
      layout = layouts.get(layout.layout);
    }
  }
  return view;
};

console.log(render(pages.get('home'), layouts).contents.toString());
