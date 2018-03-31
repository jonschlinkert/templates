module.exports = function(handlebars) {
  return {
    name: 'handlebars',
    instance: handlebars,
    compile: function(view, options) {
      view.fn = view.fn || handlebars.compile(view.contents.toString(), options);
    },
    render: function(view, locals, options) {
      const data = Object.assign({}, locals, view.data);
      if (options && options.helpers) {
        handlebars.registerHelper(options.helpers);
      }
      if (options && options.partials) {
        handlebars.registerPartial(options.partials);
      }
      view.contents = Buffer.from(view.fn(data));
    }
  }
};
