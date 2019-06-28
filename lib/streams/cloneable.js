'use strict';

/**
 * This code is modified from clonable-readable
 * https://github.com/mcollina/cloneable-readable
 * Copyright (c) 2016 Matteo Collina
 */

const { PassThrough } = require('readable-stream');

/**
 * Create a cloneable readable stream
 */

class Cloneable extends PassThrough {
  constructor(stream, options = {}) {
    const objectMode = stream._readableState.objectMode;
    const opts = Object.assign({}, options);
    opts.objectMode = objectMode;
    super(opts);

    this.constructor = stream.constructor;
    this._original = stream;
    this._clonesCount = 1;
    forwardDestroy(stream, this);

    this.on('newListener', onData);
    this.once('resume', onResume);
    this._hasListener = true;
  }

  clone() {
    if (!this._original) throw new Error('already started');
    this._clonesCount++;
    // the events added by the clone should not count
    // for starting the flow
    this.removeListener('newListener', onData);
    const clone = new Clone(this);
    if (this._hasListener) {
      this.on('newListener', onData);
    }
    return clone;
  }

  _destroy(err, cb) {
    destroy(this, err, cb);
  }

  static isCloneable(stream) {
    return stream instanceof Cloneable || stream instanceof Clone;
  }
}

/**
 * Clone the stream
 */

class Clone extends PassThrough {
  constructor(parent, options = {}) {
    const objectMode = parent._readableState.objectMode;
    const opts = Object.assign({}, options);
    opts.objectMode = objectMode;
    super(opts);
    this.parent = parent;
    forwardDestroy(parent, this);
    parent.pipe(this);
    this.constructor = parent.constructor;

    // the events added by the clone should not count for starting
    // the flow so we add the newListener handle after we are done
    this.on('newListener', onDataClone);
    this.on('resume', () => {
      this.removeListener('newListener', onDataClone);
      process.nextTick(() => clonePiped(this.parent));
    });
  }

  clone() {
    return this.parent.clone();
  }

  _destroy(err, cb) {
    destroy(this, err, cb);
  }
}

function clonePiped(stream) {
  if (--stream._clonesCount === 0 && !stream._readableState.destroyed) {
    stream._original.pipe(stream);
    stream._original = undefined;
  }
}

function destroy(stream, err, cb) {
  if (!err) {
    stream.push(null);
    stream.end();
    stream.emit('close');
  }
  process.nextTick(() => cb(err));
}

function forwardDestroy(src, dest) {
  src.on('error', err => dest.destroy(err));
  src.on('close', () => dest.end());
}

function onData(event, listener) {
  if (event === 'data' || event === 'readable') {
    this._hasListener = false;
    this.removeListener('newListener', onData);
    this.removeListener('resume', onResume);
    process.nextTick(() => clonePiped(this));
  }
}

function onResume() {
  this._hasListener = false;
  this.removeListener('newListener', onData);
  process.nextTick(() => clonePiped(this));
}

// We start the flow once all clones are piped or destroyed
function onDataClone(event, listener) {
  if (event === 'data' || event === 'readable' || event === 'close') {
    process.nextTick(() => clonePiped(this.parent));
    this.removeListener('newListener', onDataClone);
  }
}

module.exports = Cloneable;
