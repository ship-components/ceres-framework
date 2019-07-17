const Promise = require('bluebird');

module.exports = function(config) {
  return new Promise(function(resolve, reject) {
    try {
      const r = require('rethinkdb');
      const version = require('rethinkdb/package.json').version;

      r.connect(config.db)
        .then(function(connection) {
          resolve({
            r,
            version,
            connection,
          });
        })
        .catch(function(err) {
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
};
