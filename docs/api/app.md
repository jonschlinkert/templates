---
layout: nil
---

### App
API for the main `Templates` class.

{%= apidocs("index.js", {appname: 'app', ctor: 'templates'}) %}

***

### Engines
{%= apidocs("lib/plugins/engine.js") %}

***

### Helpers
{%= apidocs("lib/plugins/helpers.js", {appname: 'app'}) %}

### Built-in helpers
{%= apidocs("lib/helpers.js", {appname: 'app'}) %}

***

### View
API for the `View` class.

{%= apidocs("lib/view.js") %}

#### View Data
{%= apidocs("lib/plugins/context.js", {appname: 'view'}) %}

***

### Item
API for the `Item` class.

{%= apidocs("lib/item.js") %}

#### Item Data
{%= apidocs("lib/plugins/context.js", {appname: 'item'}) %}

***

### Views
API for the `Views` class.

{%= apidocs("lib/views.js") %}

#### Views Data
{%= apidocs("lib/plugins/context.js", {appname: 'views'}) %}


***

#### Lookup methods
{%= apidocs("lib/plugins/lookup.js") %}


***

### Collections
API for the `Collections` class.

{%= apidocs("lib/collection.js") %}
{%= apidocs("lib/plugins/context.js", {appname: 'collection'}) %}

***

### List
API for the `List` class.

{%= apidocs("lib/list.js") %}
{%= apidocs("lib/plugins/context.js", {appname: 'list'}) %}

***

### Group
API for the `Group` class.

{%= apidocs("lib/group.js") %}

***

### Lookups
{%= apidocs("lib/plugins/lookup.js") %}

***

### Rendering
{%= apidocs("lib/plugins/render.js") %}

***

### Context
{%= apidocs("lib/plugins/context.js", {appname: 'app'}) %}

***

### Routes and middleware
{%= apidocs("lib/plugins/routes.js") %}

***

### is
{%= apidocs("lib/plugins/is.js") %}

***

## History
{%= doc('changelog.md') %}
