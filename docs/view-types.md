---
title: View types
---

Whereas "view collections" are used for organizing and caching views, "view types" determine how the individual views in a collection will be handled during the render cycle. For example, views with the `partial` view type will be merged onto the context before being passed to the template engine for rendering, but views with the `layout` and `renderable` types will not.

**View types**

This library currently supports three view types: `partial`, `renderable` and `layout`.  Passed on the `viewType` option with a collection is created, collections may have one _or more_ view types, defaulting to `renderable` if no other types are defined. 

- `partial`: allows "partial views" to be injected into other views. useful for components, document fragments, or other snippets of reusable code or content. 
- `layout`: allows views to "wrap" other views (of any type, including other layouts or partials) with common code or content. 
- `renderable`: views that have a one-to-one relationship with rendered files that will eventually be visible to a user or visitor to a website. For example: pages or blog posts.


**Jump ahead**

Available view types:

- [renderable](#renderable)
- [partial](#partial)
- [layout](#layout)

**The basics**

View types determine what will happen to templates in a collection at certain points during the build process, and:

- every view collection must define at least one view type. If no type is defined, `renderable` is used by default.
- more than one type may be defined, but this should be done sparingly to avoid unnecessarily creating methods and logic that aren't needed (continue reading to learn more about this below).
- view types are defined on the `.create()` or `.collection()` method options.

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

## Choosing a type

This section describes each type, its unique attributes, and why you might need one type versus another.

### Renderable

Views that belong to the `renderable` view type are decorated with methods that are unique to this view type: `compile` and `render`. 

### Partial

Views that belong to the `partial` view type may be injected into other templates of any view type (including `partial` views).

### Layout

Views in a collection with the `layout` view type may be used to wrap other templates of any view type (including `layout`) with common code or content.