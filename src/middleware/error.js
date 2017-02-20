module.exports = function(ceres) {
	// Next is required for Express to reconize this as an error middleware
  return function(err, req, res, next){ // eslint-disable-line no-unused-vars
    ceres.log.error(err);
    if(ceres.config.env === 'production') {
      res.status(500).send('Internal Server Error').end();
    } else {
      res.status(500).send(err).end();
    }
  };
};
