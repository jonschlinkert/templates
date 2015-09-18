# View types

<!-- toc -->

**Jump ahead**

Available view types:

- [renderable](#renderable)
- [partial](#partial)
- [layout](#layout)

**Overview**

View types determine what will happen to templates in a collection at certain points during the build process, and:

- every view collection belongs to at least one view type
- View types are determined when a collection is created using the `.create()` method

## Defining view types

Pass a string or array of view types on the `viewType` option:

```js
app.create('includes', {viewType: 'partial'});
console.log(app.includes.options)
//=> {viewType: ['partial']}
```

If no `viewType` is defined, `renderable` will be used:

```js
app.create('pages');
console.log(app.pages.options)
//=> {viewType: ['renderable']}
```

## Types

This section describes each type and its unique attributes.

### Renderable

Views that belong to the `renderable` view type are decorated with methods that are unique to this view type: `compile` and `render`. 

### Partial

Views that belong to the `partial` view type may be injected into other templates of any view type (including `partial` views).

### Layout

Views in a collection with the `layout` view type may be used to wrap other templates of any view type (including `layout`) with common code or content.