# Overview

A "template" is a..., and templates are commonly used for... Templates is a node.js library that provides a set of well-thought-out API methods to make this process easier. The Templates API has methods for managing template collections, dynamically rendering templates using any node.js template engine, and selectively transforming or modifying templates at customizable points during the render cycle.

Templates' API may be used as the basis for creating a static website generator, blog framework, markdown documentaton system, and other similar use cases.

**TODO: questions to answer**

- what is a template and how do they work?
- what is templating?
- why are templates useful?
- use cases

**Create list of templating languages**

- node.js - mustache, handlebars, pug, liquid
- php - smarty, blade, mustache
- ruby - liquid, erb


***

Whether you are creating a static website, style guide, blog, or documentation, reusable templates can make the job easier.

It's common for web designers and developers to use templates for generating custom web pages and designs.

Static web page elements
Dynamic elements based on web request parameters
Static content, providing basic structure and appearance.
Content management systems use templates for themes
Web application frameworks use templates for scaffolding
Web forms
Generate RSS and Atom syndication feeds
pagination
navigation
i18n

A web template system is composed of the following:

- template engine - a library or application that replaces
Content resource: any of various kinds of input data streams, such as from a relational database, XML files, LDAP directory, and other kinds of local or networked data;
Template resource: web templates specified according to a template language;
The template and content resources are processed and combined by the template engine to mass-produce web documents. For purposes of this article, web documents include any of various output formats for transmission over the web via HTTP, or another Internet protocol.


Many definitions exist for the terms "boilerplate", "scaffold" and "template". The following definitions describe how these concepts are used in our projects.

## Terminology

- template - Resuable file, code or content that contains "placeholder" values, which will eventually be replaced with real values by a rendering (template) engine.
- template engine - processor, parser
- template language - syntax, delimiters, expression, block, variable, filter
- context
- compiling
- caching
- rendering
- middleware
- layout
- partial - include

## Features

Engine (implementation) = engine name
Languages = implementation language of the engine (not the template script language)
License = Software license agreement
Platform = Computing platform
Variables = script language power to use variables
Functions = script language power to use functions
Includes = script language power include external files
Conditional inclusion = script language power to conditional includes
Looping = script language power to do loops (for, while) or recursion
Evaluation (language) = script language power to do "eval command" (to the implementation language)
Assignment = set names and references to sub-templates (?)
Errors and exceptions = engine output script errors.
i18n = Internationalization and localization feature
Natural templates = the template can be a document as valid as the final result, the engine syntax doesn't break the document's structure
Inheritance = Supports the ability to inherit a layout from a parent template, separately overriding arbitrary sections of the parent template's content.


## What are templates used for?

```js
let arr = ['bar', 'foo'];
console.log(arr[arr.indexOf('foo')])
```


## Template engines

Common features of template engines:

- interpolation, variables, placeholders
- template inheritance - mixins, extends, layouts, sections
- template inclusion - includes, partials
- loops, blocks and conditional evaluation
- functions (helpers and filters)
  * text modification or replacement

### Template engine examples

Given the following data object:

```js
const locals = {
  users: [
    { name: 'Bob' },
    { name: 'Alice' },
    { name: 'Grant' }
  ]
};
```

**Handlebars**

```handlebars
<ul>
{{#each users as|user|}}
  <li>Hello, {{user.name}}.</li>
{{/each}}
</ul>
```

**liquid**

```liquid
<ul>
{% for user of users %}
  <li> Hello, {{user.name}}.</li>
{% endfor %}
</ul>
```

**ejs and lodash**

```ejs
<ul>
<% for(var i = 0; i < users.length; i++) {%>
  <li>Hello, <%= users[i].name %>.</li>
<% } %>
</ul>
```

