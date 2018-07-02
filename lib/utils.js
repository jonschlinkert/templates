'use strict';

const { Transform } = require('stream');
const noop = (data, enc, next) => next(null, data);

define(exports, 'Router', () => require('en-route'));

function define(obj, key, fn) {
  Reflect.defineProperty(obj, key, { get: fn });
}

exports.dot = str => (str && str[0] === '.') ? str.slice(1) : str;
exports.isString = val => typeof val === 'string';
exports.isBuffer = val => typeOf(val) === 'buffer';
exports.isStream = val => exports.isObject(val) && typeof val.pipe === 'function';
exports.isObject = val => {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
};

exports.define = function(obj, key, val) {
  Reflect.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: val
  });
};

const binaryExts = [
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
];

const isBinaryExt = exports.isBinaryExt = function(ext, exts = binaryExts) {
  if (!ext || typeof ext !== 'string') return false;
  if (ext[0] === '.') ext = ext.slice(1);
  return exts.includes(ext.toLowerCase());
};

exports.isBinary = file => {
  file.isBinary = () => {
    if (typeof file._isBinary === 'boolean') {
      return file._isBinary;
    }

    if (file.isNull() || file.isDirectory() || file.isStream()) {
      file._isBinary = false;
      return false;
    }

    // quick check for known binary extensions
    if (isBinaryExt(file.extname)) {
      file._isBinary = true;
      return true;
    }

    // const len = file.stat ? file.stat.size : file.contents.length;
    // file._isBinary = utils.isBinary.sync(file.contents, len);
    // return file._isBinary;
    return false;
  };
  return file;
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
  if (val instanceof RegExp) return 'regexp';
  if (val instanceof Date) return 'date';
  if (val instanceof Map) return 'map';
  if (val instanceof Set) return 'set';
  if (isBuffer(val)) return 'buffer';
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
