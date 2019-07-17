module.exports = () => {
  return (req, res, next) => {
    // eslint-disable-line no-unused-vars
    next(new Error('Not Found: Unable to find resource'));
  };
};
