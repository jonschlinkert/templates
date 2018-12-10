
exports.date_to_rfc822 = date => {
  return new Date(date).toUTCString();
};
