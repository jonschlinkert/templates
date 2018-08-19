'use strict';

const symbol = Symbol.for('TEMPLATES_EVENT_LISTENERS');

/**
 * Create a new Emitter
 */

class Emitter {
  constructor() {
    this[symbol] = {};
  }

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
    return name ? this[symbol][name] || (this[symbol][name] = []) : this[symbol];
  }

  /**
   * Listen for event `name` with the given `fn`.
   *
   * ```js
   * emitter.on('error', console.error);
   * ```
   * @name .on
   * @param {String} `name`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  on(name, fn) {
    this.listeners(name).push(fn);
    return this;
  }

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * ```js
   * emitter.once('once', err => {
   *   console.error(err);
   *   process.exit(1);
   * });
   * ```
   * @name .once
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  once(event, fn) {
    let on = (...args) => {
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
   * emitter.off('error');
   * emitter.off('error', fn);
   * ```
   * @name .off
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  off(name, fn) {
    // remove all listeners
    if (!name) {
      this[symbol] = {};
      return this;
    }

    // remove all listeners for event "name"
    if (!fn) {
      this[symbol][name] = [];
      return this;
    }

    // remove all instances of "fn" from event "name"
    let listeners = this.listeners(name);
    for (let i = 0; i < listeners.length; i++) {
      let ele = listeners[i];
      if (ele === fn || ele.fn === fn) {
        listeners.splice(i--, 1);
      }
    }
    return this;
  }

  /**
   * Emit event `name` with the given args.
   *
   * ```js
   * emitter.emit('state',  { some: 'useful info' });
   * ```
   * @name .emit
   * @param {String} `name` Event name.
   * @param {...*} [rest] Any number of additional arguments.
   * @return {Object} Returns the instance for chaining.
   * @api public
   */

  emit(name, ...rest) {
    for (let fn of [...this.listeners(name)]) fn.call(this, ...rest);
    return this;
  }

  /**
   * Returns true if the emitter has listeners registered for event `name`.
   *
   * ```js
   * console.log(emitter.hasListeners('foo')); // false
   * emitter.on('foo', 'do stuff');
   * console.log(emitter.hasListeners('foo')); // true
   * ```
   * @name .hasListeners
   * @param {String} `name` Event name
   * @return {Boolean}
   * @api public
   */

  hasListeners(name) {
    return this.listeners(name).length > 0;
  }
}

/**
 * Expose `Emitter`
 */

module.exports = Emitter;
