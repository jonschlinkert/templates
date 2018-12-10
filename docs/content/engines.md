# Engines

- register a template engine for rendering views from any collection with the `app.engine()` method.
- register a template engine for rendering views for a specific collection using the `collection.engine()` method
- Engines may be a "render" function or object
- If an object, engines may have `.render`, `.compile`, `.renderSync`, and `.compileSync` methods.


```js
app.engine('hbs', require('some-engine'));
app.engine(['hbs', 'html'], require('some-engine'));
```

## Registering engines

- engines may be registered as objects or functions
- when registered as an object, it must have `.render` and `.compile` methods (TODO: double check methods)
- when registered as a function, the function is used as the `.render` method, and a noop function is used for `.compile`.


## Layout engine

[Layouts](./layouts.md) are applied to views by a special built-in engine. If you wish to customize how layouts are applied to views, or disable this functionality altogether, you can override the built-in engine by registering your own engine (or a no-op engine) using the name `layout`.

**Example**

```js
// noop layout engine
app.engine('layout', view => view);

// custom layout engine
app.engine('layout', (view, layouts) => {
  let layout = layouts.get(view.layout);
  let str;

  while (layout) {
    str = layout.contents.toString().split('{% body %}').join(view.contents.toString());
    view.contents = Buffer.from(str);

    if (layout.layout) {
      layout = layouts.get(layout.layout);
    }
  }
  return view;
});
```
