'use strict';

var debug = require('debug')('base:templates:layout');
var utils = require('../utils');

module.exports = function(proto) {

  /**
   * Apply a layout to the given `view`.
   *
   * @name .applyLayout
   * @param  {Object} `view`
   * @return {Object} Returns a `view` object.
   */

  proto.applyLayout = function(view) {
    debug('applying layout to view "%s"', view.path);
    var app = this;

    if (view.options.layoutApplied) {
      return view;
    }

    // handle pre-layout middleware
    app.handleOnce('preLayout', view);

    // get the name of the first layout
    view.layout = app.resolveLayout(view);

    var opts = {};
    utils.extend(opts, app.options);
    utils.extend(opts, view.options);
    if (typeof view.context === 'function') {
      utils.extend(opts, view.context());
    }

    // if no layout is defined, `app.options.layout`
    if (view.layout === 'undefined' && utils.isRenderable(view)) {
      view.layout = app.option('layout');
    }

    // if still no layout is defined, bail out
    if (utils.isFalsey(view.layout)) {
      return view;
    }

    try {
      // build the layout stack
      var stack = buildStack(app, view.layout, view);

      // actually apply the layout
      utils.layouts(view, stack, opts);
      view.currentLayout = view.layout;
      app.handleOnce('onLayout', view);
      delete view.currentLayout;

      view.enable('layoutApplied');
      view.option('layoutStack', view.history);
      view.locals.settings = view.locals.settings || {};
      view.locals.settings.indent = view.totalIndent;

      // actually apply the layout
      utils.layouts(view, stack, opts);
      view.enable('layoutApplied');
      view.option('layoutStack', view.history);
    } catch (err) {
      if (app.hasListeners('error')) {
        app.emit('error', err);
      } else {
        throw err;
      }
    }

    // handle post-layout middleware
    app.handleOnce('postLayout', view);

    return view;
  };

  /**
   * Asynchronously apply a layout to the given `view`.
   *
   * @name .applyLayoutAsync
   * @param {Object} `view`
   * @param {Function} `callback`
   */

  proto.applyLayoutAsync = function(view, cb) {
    debug('applying layout to view "%s"', view.path);
    var app = this;

    if (view.options.layoutApplied) {
      cb(null, view);
      return;
    }

    // handle pre-layout middleware
    this.handleOnce('preLayout', view, function(err, file) {
      if (err) return cb(err);

      file.layout = app.resolveLayout(file);

      // if no layout is defined, `app.options.layout`
      if (file.layout === 'undefined' && utils.isRenderable(file)) {
        file.layout = app.option('layout');
      }

      // if still no layout is defined, bail out
      if (utils.isFalsey(file.layout)) {
        cb(null, file);
        return;
      }

      var opts = {};

      utils.extend(opts, app.options);
      utils.extend(opts, file.options);
      utils.extend(opts, file.context());

      try {
        // build the layout stack
        var stack = buildStack(app, file.layout, file);

        // actually apply the layout
        utils.layouts(file, stack, opts);
        file.currentLayout = file.layout;
        app.handleOnce('onLayout', file);
        delete file.currentLayout;

        file.enable('layoutApplied');
        file.option('layoutStack', file.history);
        file.locals.settings = file.locals.settings || {};
        file.locals.settings.indent = file.totalIndent;
      } catch (err) {
        if (app.hasListeners('error')) {
          app.emit('error', err);
        }
        cb(err);
        return;
      }

      // handle post-layout middleware
      app.handleOnce('postLayout', file, cb);
    });
  };

  /**
   * Get the layout stack by creating an object from all
   * collections with the "layout" `viewType`
   *
   * @param {Object} `app`
   * @param {String} `name` The starting layout name
   * @param {Object} `view`
   * @return {Object} Returns the layout stack.
   */

  function buildStack(app, name, view) {
    var layoutExists = false;
    var registered = 0;
    var layouts = {};

    // get all collections with `viewType` layout
    var collections = app.viewTypes.layout;
    var len = collections.length;
    var idx = -1;

    while (++idx < len) {
      var collection = app[collections[idx]];

      // detect if at least one of the collections has
      // our starting layout
      if (!layoutExists && collection.getView(name)) {
        layoutExists = true;
      }

      // add the collection views to the layouts object
      for (var key in collection.views) {
        layouts[key] = collection.views[key];
        registered++;
      }
    }

    if (registered === 0) {
      throw app.formatError('layouts', 'registered', name, view);
    }

    if (layoutExists === false) {
      throw app.formatError('layouts', 'notfound', name, view);
    }
    return layouts;
  }
};
