'use strict';

const key = name => '$' + name;

class Emitter {

  /**
   * Return the array of registered listeners for `event`.
   *
   * ```js
   * // all listeners for event "status"
   * console.log(emitter.listeners('status'));
   * // all listeners
   * console.log(emitter.listeners());
   * ```
   * @name .listeners
   * @param {String} `event` Event name
   * @return {Array}
   * @api public
   */

  listeners(name) {
    if (!this._listeners) define(this, '_listeners', {});
    if (!name) return this._listeners;
    return this._listeners[key(name)] || (this._listeners[key(name)] = []);
  }

  /**
   * Listen on the given `event` with `fn`.
   *
   * ```js
   * emitter.on('foo', () => 'do stuff');
   * ```
   * @name .on
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  on(event, fn) {
    this.listeners(event).push(fn);
    return this;
  }

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * ```js
   * emitter.once('once', () => 'do stuff');
   * ```
   * @name .once
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  once(event, fn) {
    const on = (...args) => {
      this.off(event, on);
      fn.call(this, ...args);
    };
    on.fn = fn;
    this.on(event, on);
    return this;
  }

  /**
   * Remove the given listener for `event`, or remove all
   * registered listeners if `event` is undefined.
   *
   * ```js
   * emitter.off();
   * emitter.off('foo');
   * emitter.off('foo', fn);
   * ```
   * @name .off
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  off(event, fn) {
    this.listeners();

    // remove all listeners
    if (!event) {
      this._listeners = {};
      return this;
    }

    // remove all listeners for "event"
    if (!fn) {
      this._listeners[key(event)] = [];
      return this;
    }

    // remove all instances of "fn" from "event"
    removeListeners(fn, this.listeners(event));
    return this;
  }

  /**
   * Emit `event` with the given args.
   *
   * ```js
   * emitter.emit('foo', 'bar');
   * ```
   * @name .emit
   * @param {String} `event`
   * @param {Mixed} ...
   * @return {Emitter}
   */

  emit(event, ...rest) {
    const listeners = this.listeners(event).slice();
    for (const fn of listeners) {
      fn.call(this, ...rest);
    }
    return this;
  }

  /**
   * Returns true if the emitter has registered listeners for `event`.
   *
   * ```js
   * emitter.on('foo', 'do stuff');
   * console.log(emitter.has('foo')); // true
   * console.log(emitter.has('bar')); // false
   * ```
   * @name .has
   * @param {String} `event`
   * @return {Boolean}
   * @api public
   */

  hasListeners(event) {
    return this.listeners(event).length > 0;
  }
}

/**
 * Remove all instances of the given `fn` from listeners.
 */

function removeListeners(fn, listeners) {
  for (let i = 0; i < listeners.length; i++) {
    const listener = listeners[i];
    if (listener === fn || listener.fn === fn) {
      listeners.splice(i, 1);
      return removeListeners(fn, listeners);
    }
  }
}

function define(obj, key, val) {
  Reflect.defineProperty(obj, key, {
    enumerable: false,
    configurable: true,
    writable: true,
    value: val
  });
}

/**
 * Expose `Emitter`
 */

module.exports = Emitter;
