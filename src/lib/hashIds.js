const Hashids = require('hashids');

module.exports = function(Ceres) {
  if (typeof Ceres.config.hashIds !== 'object') {
    const setupError = function() {
      throw new Error('hashIds not configured');
    };

    return {
      decode: setupError,
      encode: setupError,
    };
  }
  Ceres.log._ceres.silly('HashIds enabled: Using secret "%s" for ids', Ceres.config.hashIds.secret);

  return new Hashids(Ceres.config.hashIds.secret, Ceres.config.hashIds.minLength);
};
