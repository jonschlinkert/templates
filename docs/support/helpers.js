exports.render = function(str, ...rest) {
  const callback = rest.pop();
  const locals = Object.assign({}, ...rest);
  const view = this.app.view({path: 'temp', content: str});
  view.isBinary = () => false;

  this.app.render(view, locals, (err, res) => {
    if (err) {
      callback(err);
      return;
    }
    callback(null, res.contents.toString());
  });
};
