/**
 * Connect to database connection
 * @param  {Object} config
 * @return {Promise}
 */
module.exports = function(config, Ceres) {
  if (config.db.type === 'bookshelf') {
    // Setup Bookself
    return require('./bookself')(config, Ceres);
    // return new Promise(function(resolve) {
    //   resolve(require('./bookself')(config, Ceres));
    // }).catch(function(err){
    //   throw err;
    // });
  } else if (config.db.type === 'rethinkdb'){
    return require('./rethinkdb')(config, Ceres);
  } else {
    // Unknown config
    throw new Error('Unknown config.db.type');
  }
};
