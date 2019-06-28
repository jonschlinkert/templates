# Layouts

A "layout" is a special kind of template that contains common content that can be used by other templates. For example, a very basic HTML layout might look something like this:

```handlebars
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
  </head>
  <body>
    {% body %}
  </body>
</html>
```

You can define as many layouts as you want, and layouts can be used for any kind of content, including markdown, HTML, CSS, LESS, SASS, JavaScript, or anything else you can think of! In fact, the Assemble core team uses markdown layouts to simplify creating README's for new projects.

## Nested layouts

Layouts can also use other layouts. For example, a "base" layout with the bare necessities might look something like this:

```handlebars
<!-- templates/layouts/base.html -->
<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <link href="assets/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body>
    {% body %}
    <script src="assets/js/bootstrap.min.js"></script>
  </body>
</html>
```

And another layout might contain the markup needed for a top navbar and the "main contents" of your site.

```handlebars
---
layout: base
---
<!-- templates/layouts/navbar.html -->
<nav class="navbar fixed-top">
  <a class="navbar-brand" href="#">Home</a>
  <ul class="navbar-nav">
    <li class="nav-item"> <a href="/about">About</a> </li>
    <li class="nav-item"> <a href="/contact">Contact</a> </li>
  </ul>
</nav>

<div id="products">
  {{#each products sellside_id="slslsl10290werwrw9oiios"}}
  {{/each}}
</div>

<main role="main" class="container">
  {% body %}
</main>
```


## Rendering layouts




## Layout engines

Assemble uses a _layout engine_ to handle the process of applying layouts to views.
