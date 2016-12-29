'use strict';

var dry = require('dry');
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
    if (view.options.layoutApplied) {
      return view;
    }

    // handle pre-layout middleware
    this.handleOnce('preLayout', view);

    // get the name of the first layout
    var name = this.resolveLayout(view);
    var app = this;

    var opts = { normalizeWhitespace: false };
    utils.extend(opts, this.options);
    utils.extend(opts, view.options);

    if (typeof view.context === 'function') {
      utils.extend(opts, view.context());
    }

    // if no layout is defined, `app.options.layout`
    if (typeof name === 'undefined' && utils.isRenderable(view)) {
      name = this.option('layout');
    }

    // if still no layout is defined, bail out
    if (utils.isFalsey(name)) {
      return view;
    }

    try {
      // build the layout stack
      var stack = buildStack(this, name, view);
      var opt = utils.extend({}, opts, {
        files: stack
      });

      if (!view.layout) {
        view.layout = name;
      }

      // actually apply the layout
      dry(view, opt);
      view.enable('layoutApplied');

      // handle post-layout middleware
      this.handleOnce('postLayout', view);
    } catch (err) {
      if (this.hasListeners('error')) {
        this.emit('error', err);
      } else {
        throw err;
      }
    }
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

      // get the name of the first layout
      var name = app.resolveLayout(file);
      var str = file.content;

      var opts = { normalizeWhitespace: false };
      utils.extend(opts, app.options);
      utils.extend(opts, file.options);
      utils.extend(opts, file.context());

      // if no layout is defined, `app.options.layout`
      if (typeof name === 'undefined' && utils.isRenderable(file)) {
        name = app.option('layout');
      }

      // if still no layout is defined, bail out
      if (utils.isFalsey(name)) {
        cb(null, file);
        return;
      }

      try {
        // build the layout stack
        var stack = buildStack(app, name, file);
        var opt = utils.extend({}, opts, {files: stack});

        if (!file.layout) {
          file.layout = name;
        }

        // actually apply the layout
        dry(file, opt);
        file.enable('layoutApplied');
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
