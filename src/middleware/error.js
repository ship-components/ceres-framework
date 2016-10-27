module.exports = function(ceres) {
  return function(err, req, res, next){
    ceres.log.error(err);
    if(ceres.config.env === 'production') {
      res.status(500).send('Internal Server Error').end();
    } else {
      res.status(500).send(err).end();
    }
  };
};
