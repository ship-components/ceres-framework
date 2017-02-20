module.exports = function() {
  return function(req, res, next){ // eslint-disable-line no-unused-vars
    res.status(404).send('Unable to find resource').end();
  };
};
