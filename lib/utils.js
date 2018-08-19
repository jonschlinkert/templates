'use strict';

const { Transform } = require('stream');
const noop = (data, enc, next) => next(null, data);
const strip = str => str.replace(/\\(?=\.)/g, '');
const split = str => str.split(/(?<!\\)\./).map(strip);
const path = require('path');

define(exports, 'Router', () => require('en-route'));
define(exports, 'fileType', () => require('file-type'));

function define(obj, key, get) {
  Reflect.defineProperty(obj, key, { get });
}

exports.set = (obj = {}, prop = '', val) => {
  return split(prop).reduce((acc, k, i, arr) => {
    return (acc[k] = arr.length - 1 > i ? (acc[k] || {}) : val);
  }, obj);
};

exports.get = (obj = {}, prop = '') => {
  return obj[prop] == null
    ? split(prop).reduce((acc, k) => acc && acc[strip(k)], obj)
    : obj[prop];
};

exports.isString = val => typeof val === 'string';
exports.isBuffer = val => typeOf(val) === 'buffer';
exports.isObject = val => typeOf(val) === 'object';
exports.isStream = val => exports.isObject(val) && typeof val.pipe === 'function';
exports.stripDot = str => (str && str[0] === '.') ? str.slice(1) : str;

exports.define = (obj, key, val) => {
  Reflect.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: val
  });
};

exports.first = args => {
  for (const ele of args) {
    if (ele != null) {
      return ele;
    }
  }
};

exports.endsWith = (filepath, substr, options = {}) => {
  if (!filepath || !substr) return false;
  if (options.nocase !== false) {
    filepath = filepath.toLowerCase();
    substr = substr.toLowerCase();
  }

  if (filepath === substr) return true;

  const b = substr.split(/[\\/]+/);
  if (b[0] === '') {
    return filepath.endsWith(substr);
  }

  const a = filepath.split(/[\\/]+/);
  while (b.length && a.length) {
    if (b.pop() !== a.pop()) {
      return false;
    }
  }
  return true;
};

const binaryExts = exports.binaryExts = new Set([
  'bin',
  'csv',
  'dmg',
  'doc',
  'docm',
  'docx',
  'dotm',
  'DS_Store',
  'eol',
  'eot',
  'epub',
  'exe',
  'flac',
  'flv',
  'gif',
  'graffle',
  'gz',
  'gzip',
  'h261',
  'h263',
  'h264',
  'icns',
  'ico',
  'img',
  'iso',
  'jar',
  'jpeg',
  'jpg',
  'm3u',
  'm4a',
  'm4v',
  'mka',
  'mkv',
  'mobi',
  'mov',
  'mp3',
  'mp4',
  'mp4a',
  'mpeg',
  'mpg',
  'ogg',
  'otf',
  'pages',
  'pbm',
  'pcx',
  'pdb',
  'pdf',
  'png',
  'ppt',
  'pptm',
  'pptx',
  'psd',
  'rar',
  'rtf',
  'swf',
  'tar',
  'tbz',
  'tbz2',
  'tga',
  'tgz',
  'tif',
  'tiff',
  'tlz',
  'ttc',
  'ttf',
  'txz',
  'wav',
  'wdp',
  'weba',
  'webm',
  'webp',
  'wma',
  'wmv',
  'woff',
  'woff2',
  'xls',
  'xlsx',
  'zip',
  'zipx'
]);

const isBinaryExt = exports.isBinaryExt = function(ext, exts = binaryExts) {
  if (!ext || typeof ext !== 'string') return false;
  if (ext[0] === '.') ext = ext.slice(1);
  return exts.has(ext.toLowerCase());
};

exports.isBinary = value => {
  let type = exports.fileType(value);
  if (type) {
    return isBinaryExt(type.ext);
  }
  return false;
};

exports.isBinaryFile = file => {
  if (typeof file._isBinary === 'boolean') {
    return file._isBinary;
  }

  // Quick check for known binary extensions. This is performed
  // first since file.contents might not exist yet
  if (file.path && isBinaryExt(file.extname)) {
    file._isBinary = true;
    return true;
  }

  // false if the file is a directory, or contents is null or a stream.
  // although it might still be binary if a stream, we're ignoring
  // this check for now
  if (file.isNull() || file.isDirectory() || file.isStream()) {
    file._isBinary = false;
    return false;
  }

  file._isBinary = !!exports.isBinary(file.contents);
  return file._isBinary;
};

const through = (options, transform, flush) => {
  if (typeof options === 'function') {
    flush = transform;
    transform = options;
    options = null;
  }

  if (!transform) {
    transform = noop;
  }

  if (transform.length === 2) {
    const fn = transform;
    transform = (data, enc, cb) => fn(data, cb);
  }

  const stream = new Transform({ transform, flush, ...options });
  stream.setMaxListeners(0);
  return stream;
};

through.obj = (options, transform, flush) => {
  if (typeof options === 'function') {
    flush = transform;
    transform = options;
    options = null;
  }

  const opts = Object.assign({ objectMode: true, highWaterMark: 16 }, options);
  return through(opts, transform, flush);
};

function typeOf(val) {
  if (val === null) return 'null';
  if (val === void 0) return 'undefined';
  if (typeof val === 'function') return 'function';
  if (typeof val === 'string') return 'string';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'number') return 'number';
  if (isBuffer(val)) return 'buffer';
  if (typeof val === 'object') {
    if (typeof val.then === 'function') return 'promise';
    return 'object';
  }
  return typeof val;
}

function isBuffer(val) {
  if (val && val.constructor && typeof val.constructor.isBuffer === 'function') {
    return val.constructor.isBuffer(val);
  }
  return false;
}

exports.through = through;
exports.typeOf = typeOf;
exports.isBuffer = isBuffer;
