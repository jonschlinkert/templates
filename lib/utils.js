'use strict';

const { Transform } = require('stream');
const typeOf = require('kind-of');
const noop = (data, enc, cb) => cb(null, data);

exports.dot = str => (str && str[0] === '.') ? str.slice(1) : str;
exports.isString = val => typeof val === 'string';
exports.isBuffer = val => typeOf(val) === 'buffer';
exports.isStream = val => exports.isObject(val) && typeof val.pipe === 'function';
exports.isObject = val => {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
};

exports.isBinary = function(file) {
  file.isBinary = function() {
    if (typeof file._isBinary === 'boolean') {
      return file._isBinary;
    }

    if (file.isNull()) {
      file._isBinary = false;
      return false;
    }
    if (file.isDirectory()) {
      file._isBinary = false;
      return false;
    }
    if (file.isStream()) {
      file._isBinary = false;
      return false;
    }

    // quick check for known binary extensions
    const exts = ['.png', '.jpg', '.pdf', '.gif', '.eof'];
    if (exts.includes(file.extname)) {
      file._isBinary = true;
      return true;
    }

    const len = file.stat ? file.stat.size : file.contents.length;
    // file._isBinary = utils.isBinary.sync(file.contents, len);
    return file._isBinary;
  };
  return file;
};

define(exports, 'Router', () => require('en-route'));

function define(obj, key, fn) {
  Reflect.defineProperty(obj, key, { get: fn });
}

exports.define = function(obj, key, val) {
  Reflect.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: val
  });
};

exports.through = (options, transform = noop, flush) => {
  if (typeof options === 'function') {
    flush = transform;
    transform = options;
    options = null;
  }

  if (transform.length === 2) {
    const fn = transform;
    transform = (data, enc, cb) => fn(data, cb);
  }

  return new Transform({ transform, flush, ...options });
};

exports.through.obj = (options, transform, flush) => {
  if (typeof options === 'function') {
    flush = transform;
    transform = options;
    options = null;
  }

  const opts = Object.assign({ objectMode: true, highWaterMark: 16 }, options);
  return exports.through(opts, transform, flush);
};

function isBinaryExt(ext) {
  if (typeof ext !== 'string' || ext === '') {
    return false;
  }

  if (ext[0] === '.') {
    ext = ext.slice(1);
  }

  const exts = [
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

  return exts.includes(ext.toLowerCase());
}
