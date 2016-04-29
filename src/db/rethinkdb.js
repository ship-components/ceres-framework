var Promise = require('promise');

module.exports = function(config, Ceres) {
  return new Promise(function(resolve, reject){;
    try {
      var r = require('rethinkdb');
      var version = require('rethinkdb/package.json').version

      r.connect(config.db)
      .then(function(connection){
        resolve({
          r: r,
          version: version,
          connection: connection
        })
      })
      .catch(function(err){
        Ceres.log._ceres.error(err);
        reject(err);
      });
    } catch (err) {
      Ceres.log._ceres.error(err);
      reject(err);
    }
  })
};
