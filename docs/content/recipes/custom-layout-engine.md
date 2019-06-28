---
publish: false
---
## Create a custom layout engine

To make this example as simple as possible, we're going to start by demonstrating how to create a custom "layouts" engine using only [vinyl][] files, so that you can apply the concepts we use in this example to any vanilla JavaScript project. Then we'll wrap up by showing you how to use your layout engine with Assemble.

## Step 1 - Create collections for our examples

To get started, require in [vinyl][] and create a couple of "collections". The native `Map` class works nicely for this example, so let's create
Since we want to use vanilla jav

```js
const File = require('vinyl');
const layouts = new Map();
const pages = new Map();

pages.set('home', new File({ contents: Buffer.from('This is the home page!'), layout: 'default' }));

layouts.set('default', new File({ contents: Buffer.from('A {% body %} A'), layout: 'inner' }));
layouts.set('inner', new File({ contents: Buffer.from('B {% body %} B'), layout: 'base' }));
layouts.set('base', new File({ contents: Buffer.from('C {% body %} C') }));
```

## Step 2 - Create our layout engine

```js
const symbol = Symbol.for('LAYOUT_HISTORY');
const render = (view, layouts) => {
  let name = view.layout;
  let layout = layouts.get(name);
  let history = view[symbol] || (view[symbol] = []);
  let str;

  while (layout && !history.includes(layout)) {
    history.push(layout);
    str = layout.contents.toString().split('{% body %}').join(view.contents.toString());
    view.contents = Buffer.from(str);

    if (layout.layout) {
      layout = layouts.get(layout.layout);
    }
  }
  return view;
};

console.log(render(pages.get('home'), layouts).contents.toString());
//=> C B A This is the home page! A B C
```

