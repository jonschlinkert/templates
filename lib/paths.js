module.exports = class Paths {
  constructor() {
    this.keys = new Map();
    this.paths = new Map();
    this.names = new Map();
    this.stems = new Map();
  }

  set(view) {
    this.keys.set(view.key, view);
    this.stems.set(view.stem, view);
    this.names.set(view.basename, view);
    this.paths.set(view.path, view);
    return this;
  }

  get(path, type) {
    if (type) return this[type].get(path);
    return this.keys.get(path)
      || this.stems.get(path)
      || this.names.get(path)
      || this.paths.get(path);
  }
}
