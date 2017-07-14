var Promise = require('bluebird');

module.exports = function(config) {
  return new Promise(function(resolve, reject){
    try {
      var r = require('rethinkdb');
      var version = require('rethinkdb/package.json').version;

      r.connect(config.db)
        .then(function(connection){
          resolve({
            r: r,
            version: version,
            connection: connection
          });
        })
        .catch(function(err){
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
};
