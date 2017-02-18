module.exports = function(ceres) {
  if (typeof ceres.config.hashIds !== 'object') {
    return function(req, res, next) {
      next(new Error('hashIds no enabled'));
    };
  }

  /**
   * Middleware function to automatically convert encrypted keys to their
   * respective ids
   * @param  {Exress.Request}     req
   * @param  {Express.Response}   res
   * @param  {Function} next
   */
  return function(req, res, next){
    if (req.params.key) {
      var id = ceres.HashIds.decode(req.params.key)[0];
      if (isNaN(id)) {
        ceres.log.warn('Error decoding key', req.params.key);
        next(new Error('InvalidKey'));
        return;
      }
      req.params.id = id;
    }
    next();
  };
};
