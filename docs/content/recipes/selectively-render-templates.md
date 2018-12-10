---
publish: false
---
# Selectively render templates

There are many different reasons to selectively render templates... TBD


```js
app.postLayout(/\.hbs$/, file => {
  if (view.type === 'renderable' && !/{{/.test(view.contents.toString())) {
    view.engine = 'noop';
  }
});
```
