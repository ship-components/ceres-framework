/**
 * Setup Caching
 */

var Promise = require('bluebird');

module.exports = function setupCache(ceres) {
  return new Promise(function(resolve, reject){
    var cache;

    /**
     * Redis
     */
    if (typeof ceres.config.cache === 'object' && ceres.config.cache.type === 'redis') {
      // Import
      var RedisCache = require('../cache/RedisCache');
      try {
        // Setup/Connect
        cache = new RedisCache(ceres.config.cache, ceres.logger('cache'));
      } catch(err) {
        // Catch any startup errors
        reject(err);
      }
    } else {
      ceres.logger('cache').debug('Cache module disabled');
    }

    resolve(cache);
  });
};
