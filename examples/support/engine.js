module.exports = function(handlebars) {
  const instance = handlebars.create();

  return {
    name: 'handlebars',
    instance: instance,
    compile: function(view, options) {
      view.fn = view.fn || instance.compile(view.contents.toString(), options);
    },
    render: function(view, locals, options) {
      const data = Object.assign({}, locals, view.data);
      if (options && options.helpers) {
        instance.registerHelper(options.helpers);
      }
      if (options && options.partials) {
        instance.registerPartial(options.partials);
      }
      view.contents = Buffer.from(view.fn(data));
    }
  }
};
