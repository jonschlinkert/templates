'use strict';

const pad = str => str.padStart(2, '0');
const dateRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})-(.*?)\.(md|hbs|html)/;

module.exports = (file, options = {}) => {
  if (options.groupBy !== 'date') return file.basename;
  let match = dateRegex.exec(file.basename);
  if (!match) return file.relative;
  let [ year, month, day, slug ] = match.slice(1);
  return `${year}/${pad(month)}/${pad(day)}/${slug}.html`;
};
