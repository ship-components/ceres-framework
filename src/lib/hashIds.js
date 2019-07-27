const Hashids = require('hashids');

/**
 * @type {import('../ceres')} ceres
 * @returns {import('hashids')}
 */
module.exports = function ids(ceres) {
  if (typeof ceres.config.hashIds !== 'object') {
    const setupError = () => {
      throw new Error('hashIds not configured');
    };

    return {
      // @ts-ignore
      decode: setupError,
      encode: setupError,
    };
  }
  ceres.log.internal.silly(
    'HashIds enabled: Using secret "%s" for ids',
    ceres.config.hashIds.secret
  );

  // @ts-ignore
  return new Hashids(ceres.config.hashIds.secret, ceres.config.hashIds.minLength);
};
