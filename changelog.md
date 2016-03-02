### v0.15.0

- removes `.removeItem` method that was deprecated in v0.10.7 from `List`
- `.handleView` is deprecated in favor of `.handleOnce` and will be removed in a future version. Start using `.handleOnce` now.
- adds a static `Templates.setup()` method for initializing any setup code that should have access to the instance before any other use code is run.
- upgrade to [base-data][] v0.4.0, which adds `app.option.set`, `app.option.get` and `app.option.merge`

### v0.14.0

Although 99% of users won't be effected by the changes in this release, there were some **potentially breaking changes**. 

- The `render` and `compile` methods were streamlined, making it clear that `.mergePartials` should not have been renamed to `mergePartialsSync`. So that change was reverted.
- Helper context: Exposes a `this.helper` object to the context in helpers, which has the helper name and options that were set specifically for that helper
- Helper context: Exposes a `this.view` object to the context in helpers, which is the current view being rendered. This was (and still is) always expose on `this.context.view`, but it makes sense to add this to the root of the context as a convenience. We will deprecate `this.context.view` in a future version.
- Helper context: `.get`, `.set` and `.merge` methods on `this.options`, `this.context` and the `this` object in helpers. 

### v0.11.0

- Default `engine` can now be defined on `app` or a collection using using `app.option('engine')`, `views.option('engine')`
- Default `layout` can now defined using `app.option('layout')`, `views.option('layout')`. No changes have been made to `view.layout`, it should work as before. Resolves [issue/#818](../../issues/818)
- Improves logic for finding a layout, this should make layouts easier to define and find going forward.
- The built-in `view` helper has been refactored completely. The helper is now async and renders the view before returning its content.
- Adds `isApp`, `isViews`, `isCollection`, `isList`, `isView`, `isGroup`, and `isItem` static methods. All return true when the given value is an instance of the respective class.
- Adds `deleteItem` method to List and Collection, and `deleteView` method to Views.
- Last, the static `_.proto` property which is only exposed for unit tests was renamed to `_.plugin`.

### v0.10.7

- Force-update [base][] to v0.6.4 to take advantage of `isRegistered` feature.

### v0.10.6

- Re-introduces fs logic to `getView`, now that the method has been refactored to be faster.

### v0.10.0

- `getView` method no longer automatically reads views from the file system. This was undocumented before and, but it's a breaking change nonetheless. The removed functionality can easily be done in a plugin.

### v0.9.5

- Fixes error messages when no engine is found for a view, and the view does not have a file extension.

### v0.9.4

- Fixes a lookup bug in render and compile that was returning the first view that matched the given name from _any_ collection. So if a partial and a page shared the same name, if the partial was matched first it was returned. Now the `renderable` view is rendered (e.g. page)

### v0.9.0

- _breaking change_: changes parameters on `app.context` method. It now only accepts two arguments, `view` and `locals`, since `ctx` (the parameter that was removed) was technically being merged in twice.

### v0.8.0

- Exposes `isType` method on `view`. Shouldn't be any breaking changes.

### v0.7.0

- _breaking change_: renamed `.error` method to `.formatError`
- adds `mergeContext` option
- collection name is now emitted with `view` and `item` as the second argument
- adds `isType` method for checking the `viewType` on a collection
- also now emits an event with the collection name when a view is created

### v0.5.1

- fixes bug where `default` layout was automatically applied to partials, causing an infinite loop in rare cases.
