
module.exports = async(collection, context) => {
  let pending = [];
  for (let file of collection.list) {
    pending.push(collection.render(file, context(file)));
  }
  return Promise.all(pending).then(() => collection);
};

module.exports.sync = (collection, context) => {
  for (let file of collection.list) {
    collection.render(file, context(file));
  }
  return collection;
};
