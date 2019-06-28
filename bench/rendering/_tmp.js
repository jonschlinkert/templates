// app.onLoad(/\.hbs$/, hbs.compile.bind(hbs));
// app.layouts.onLoad(/\.hbs$/, hbs.compile.bind(hbs));
// app.onLoad(/\.hbs$/, app.compile.bind(app));


// const view = app.pages.set('templates/foo.hbs', {
//   contents: Buffer.from('Name: {{name}}, {{description}} {{> button text="Click me!" }} {{> button2 text="Click me too!" }} {{> button3 text="Click me three!" }}'),
//   data: { name: 'Brian' },
//   layout: 'default'
// });


const view = app.pages.set('templates/foo.hbs', {
  contents: Buffer.from('Name: {{name}}. {{description}}. {{> button text="Click me!" }}'),
  data: { name: 'Brian' },
  layout: 'default'
});

app.partials.set({ path: 'button', contents: Buffer.from('<button>{{text}}</button>') });
app.partials.set({ path: 'button2', contents: Buffer.from('<button>{{text}}</button>') });
app.partials.set({ path: 'button3', contents: Buffer.from('<button>{{text}}</button>') });
