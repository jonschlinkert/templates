# Build cycle


```js
const app = new App();
// build - start

/**
 * do stuff with tasks, collections, etc.
 */

app.build()
  .then(() => {
    console.log('done');
    // build - end
  });
```


## Read


## Render cycle


```js
const app = new App();
// build - start

// create collections
app.task('create', cb => {
  app.create('pages');
  app.create('layouts', { kind: 'layout' });
  app.create('partials', { kind: 'partial' });
  cb();
});

// create collections
app.task('load', ['create'], cb => {
  // do stuff
  cb();
});

app.task('html', cb => {
  return app.toStream('pages').dest('dist')
});

// render cycle
app.task('render', ['load', 'html']);

app.build()
  .then(() => {
    console.log('done');
    // build - end
  });
```


## Write

