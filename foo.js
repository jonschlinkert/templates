// const template = require('lodash.template');
// const fn = template('<%= foo %>');
// console.log(fn({ foo: 'bar '}));

// function values(data, keys) {
//   var len = keys.length;
//   var vals = new Array(len);
//   while (len--) {
//     vals[len] = data[keys[len]];
//   }
//   return vals;
// }

// function compile(str) {
//   return function(data = {}, context = {}) {
//     const keys = Object.keys(data);
//     const vals = Object.values(data);
//     return Function(keys, str).apply(context, vals);
//     // return fn(data);
//   };
// }

// const str = `
//    // console.log(foo)
//  return function(obj) {
//    obj || (obj = {});
//    var __t, __p = '';
//    with (obj) {
//      __p += (__t = foo) == null ? '' : __t;
//    }
//    return __p;
//  }`;

// // const str = `
// //   console.log(b)
// // return function(a, b, c) {
// //   console.log(a, b, c)
// // }`;

// // console.log(compile(str)({foo: 'Yahoo!', b: {}, c: {}}))


// // const keys = ['contents', 'obj'];
// // const obj = {};
// // const str = `return (function(contents) {
// //   console.log(this)
// //   return contents;
// // }).call(obj)`;

// // const value = 'wahtever'

// // let fn = Function(keys, ...[str, obj]);

// // console.log(fn.call({contents: value, obj}))

// const fn = function(data) {
//   return new Function(...Object.keys(data), 'return users * salary').apply(null, Object.values(data));
// }

const layout = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>{{title}}</title>
  </head>
  <body>{% body %}</body>
</html>`;

const input = layout.replace(/`/g, '\\$&')
const str = `(function() {
return \`${input.replace('{% body %}', '\`+ body +\`')}\`
})()`;

function compile(str) {
  return function(data = {}) {
    const keys = Object.keys(data);
    const vals = Object.values(data);
    return Function(keys, 'return ' + str).apply(null, vals);
  };
}

const fn = compile(str);
console.log(fn({body: 'This is content!'}))
