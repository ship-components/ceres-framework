/**
 * Connect to database connection
 * @param  {Object} config
 * @return {Promise}
 */
module.exports = function(config) {
  if (config.db.type === 'bookshelf') {
    // Setup Bookself
    return new Promise(function(resolve) {
      resolve(require('./bookself')(config));
    });
  } else if (config.db.type === 'rethinkdb'){
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
          console.log(err);
          reject(err);
        });
      } catch (err) {
        console.log(err);
        reject(err);
      }
    })
  } else {
    // Unknown config
    throw new Error('Unknown config.db.type');
  }
};
