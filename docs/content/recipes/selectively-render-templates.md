---
publish: false
---
# Selectively render templates

There are many different reasons to selectively render templates... TBD


```js
app.postLayout(/\.hbs$/, file => {
  if (view.kind === 'renderable' && !/{{/.test(view.contents.toString())) {
    view.engine = 'noop';
  }
});
```
