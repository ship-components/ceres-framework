const Hashids = require('hashids');

module.exports = function ids(Ceres) {
  if (typeof Ceres.config.hashIds !== 'object') {
    const setupError = () => {
      throw new Error('hashIds not configured');
    };

    return {
      decode: setupError,
      encode: setupError,
    };
  }
  Ceres.log.internal.silly(
    'HashIds enabled: Using secret "%s" for ids',
    Ceres.config.hashIds.secret
  );

  return new Hashids(Ceres.config.hashIds.secret, Ceres.config.hashIds.minLength);
};
