module.exports = function(ceres) {
  return function(req, res, next){
    res.status(404).send('Unable to find resource').end();
  }
}
