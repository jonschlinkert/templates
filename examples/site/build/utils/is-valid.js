const isValid = app => app && app.files !== void 0;
isValid.app = app => isValid(app) && app.fileCache !== void 0;
isValid.collection = app => isValid(app) && app.list !== void 0;
module.exports = isValid;
