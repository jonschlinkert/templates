---
title: Middleware
---

1. onStream (when `.src()` or `.toStream()` are used)
1. onLoad
1. preLayout
1. postLayout
1. preCompile
1. postCompile
1. preRender
1. postRender
1. preWrite (when `.dest()` is used)
1. postWrite (when `.dest()` is used)

| **Method** | **Render cycle** | **Description** |
| --- | --- | --- |
| `onStream`    | no | ___ |
| `onLoad`      | no | ___ |
| `preLayout`   | yes | ___ |
| `postLayout`  | yes | ___ |
| `preCompile`  | yes | ___ |
| `postCompile` | yes | ___ |
| `preRender`   | yes | ___ |
| `postRender`  | yes | ___ |
| `preWrite`    | no | ___ |
| `postWrite`   | no | ___ |

Render cycle: only files with contents that can be processed (by a template engine, markdown processor, etc) are passed through the render cycle.



```js
function render(app, file, files) {

}
```
